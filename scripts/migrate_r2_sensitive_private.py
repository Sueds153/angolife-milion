"""
Move payment-receipts/* e exchange-proofs/* do bucket R2 público para o privado.
Uso: python scripts/migrate_r2_sensitive_private.py [--dry-run]
Lê credenciais de .env.local na raiz do projecto.
"""
import os
import sys
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV = ROOT / ".env.local"
PREFIXES = ("payment-receipts/", "exchange-proofs/")
DRY = "--dry-run" in sys.argv


def load_env() -> dict:
    env = {}
    if not ENV.exists():
        raise SystemExit(f"Missing {ENV}")
    for line in ENV.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def sign_headers(method: str, key: str, payload: bytes, env: dict, content_type: str = "") -> dict:
    # Minimal SigV4 for S3-compatible R2 using urllib only (no boto3).
    import hashlib
    import hmac
    import datetime

    region = "auto"
    service = "s3"
    host = urllib.parse.urlparse(env["R2_S3_ENDPOINT"]).hostname
    ak = env["R2_ACCESS_KEY_ID"]
    sk = env["R2_SECRET_ACCESS_KEY"]
    now = datetime.datetime.now(datetime.timezone.utc)
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    date_stamp = now.strftime("%Y%m%d")
    payload_hash = hashlib.sha256(payload).hexdigest()
    canonical_uri = "/" + "/".join(urllib.parse.quote(p, safe="") for p in key.split("/"))
    # bucket is path-style: /{bucket}/{key}
    bucket = env.get("R2_PRIVATE_BUCKET", "resolveao-private") if method != "LIST" else env.get("R2_BUCKET", "resolveao-media")
    canonical_uri = "/" + urllib.parse.quote(bucket, safe="") + canonical_uri

    headers = {
        "host": host,
        "x-amz-content-sha256": payload_hash,
        "x-amz-date": amz_date,
    }
    if content_type:
        headers["content-type"] = content_type

    signed_header_keys = sorted(headers.keys())
    canonical_headers = "".join(f"{k}:{headers[k].strip()}\n" for k in signed_header_keys)
    signed_headers = ";".join(signed_header_keys)
    canonical_request = "\n".join([
        method,
        canonical_uri,
        "",  # query
        canonical_headers,
        signed_headers,
        payload_hash,
    ])
    scope = f"{date_stamp}/{region}/{service}/aws4_request"
    string_to_sign = "\n".join([
        "AWS4-HMAC-SHA256",
        amz_date,
        scope,
        hashlib.sha256(canonical_request.encode()).hexdigest(),
    ])

    def _hmac(key: bytes, msg: str) -> bytes:
        return hmac.new(key, msg.encode(), hashlib.sha256).digest()

    k_date = _hmac(("AWS4" + sk).encode(), date_stamp)
    k_region = _hmac(k_date, region)
    k_service = _hmac(k_region, service)
    k_signing = _hmac(k_service, "aws4_request")
    signature = hmac.new(k_signing, string_to_sign.encode(), hashlib.sha256).hexdigest()

    auth = (
        f"AWS4-HMAC-SHA256 Credential={ak}/{scope}, "
        f"SignedHeaders={signed_headers}, Signature={signature}"
    )
    out = {"Authorization": auth, "x-amz-date": amz_date, "x-amz-content-sha256": payload_hash, "Host": host}
    if content_type:
        out["Content-Type"] = content_type
    return out


def s3_request(method: str, bucket: str, key: str = "", env: dict | None = None, payload: bytes = b"", content_type: str = "") -> tuple[int, bytes]:
    env = env or {}
    import hashlib
    import hmac
    import datetime
    import urllib.parse

    region = "auto"
    service = "s3"
    endpoint = env["R2_S3_ENDPOINT"].rstrip("/")
    host = urllib.parse.urlparse(endpoint).hostname
    ak = env["R2_ACCESS_KEY_ID"]
    sk = env["R2_SECRET_ACCESS_KEY"]
    now = datetime.datetime.now(datetime.timezone.utc)
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    date_stamp = now.strftime("%Y%m%d")
    payload_hash = hashlib.sha256(payload).hexdigest()

    if key:
        canonical_uri = "/" + urllib.parse.quote(bucket, safe="") + "/" + "/".join(
            urllib.parse.quote(p, safe="") for p in key.split("/")
        )
        url = f"{endpoint}{canonical_uri}"
        query = ""
    else:
        # list objects v2 with prefix
        prefix_q = urllib.parse.quote(PREFIXES[0] if False else "", safe="")
        # caller passes prefix via key="" and we use query below — handled outside
        canonical_uri = "/" + urllib.parse.quote(bucket, safe="")
        url = endpoint + canonical_uri
        query = ""

    headers = {
        "host": host,
        "x-amz-content-sha256": payload_hash,
        "x-amz-date": amz_date,
    }
    if content_type:
        headers["content-type"] = content_type

    signed_header_keys = sorted(headers.keys())
    canonical_headers = "".join(f"{k}:{headers[k].strip()}\n" for k in signed_header_keys)
    signed_headers = ";".join(signed_header_keys)
    canonical_request = "\n".join([
        method,
        canonical_uri,
        query,
        canonical_headers,
        signed_headers,
        payload_hash,
    ])
    scope = f"{date_stamp}/{region}/{service}/aws4_request"
    string_to_sign = "\n".join([
        "AWS4-HMAC-SHA256",
        amz_date,
        scope,
        hashlib.sha256(canonical_request.encode()).hexdigest(),
    ])

    def _hm(k: bytes, m: str) -> bytes:
        return hmac.new(k, m.encode(), hashlib.sha256).digest()

    k_date = _hm(("AWS4" + sk).encode(), date_stamp)
    k_region = _hm(k_date, region)
    k_service = _hm(k_region, service)
    k_signing = _hm(k_service, "aws4_request")
    signature = hmac.new(k_signing, string_to_sign.encode(), hashlib.sha256).hexdigest()
    auth = f"AWS4-HMAC-SHA256 Credential={ak}/{scope}, SignedHeaders={signed_headers}, Signature={signature}"

    req = urllib.request.Request(url, data=payload if method in ("PUT", "POST") else None, method=method)
    req.add_header("Authorization", auth)
    req.add_header("x-amz-date", amz_date)
    req.add_header("x-amz-content-sha256", payload_hash)
    if content_type:
        req.add_header("Content-Type", content_type)
    last_err = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.status, resp.read()
        except urllib.error.HTTPError as e:
            return e.code, e.read()
        except Exception as e:
            last_err = e
            import time
            time.sleep(1 + attempt)
    raise last_err


def list_keys(bucket: str, prefix: str, env: dict) -> list[str]:
    import hashlib
    import hmac
    import datetime
    import urllib.parse

    region = "auto"
    endpoint = env["R2_S3_ENDPOINT"].rstrip("/")
    host = urllib.parse.urlparse(endpoint).hostname
    ak = env["R2_ACCESS_KEY_ID"]
    sk = env["R2_SECRET_ACCESS_KEY"]
    now = datetime.datetime.now(datetime.timezone.utc)
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    date_stamp = now.strftime("%Y%m%d")
    payload_hash = hashlib.sha256(b"").hexdigest()
    canonical_uri = "/" + urllib.parse.quote(bucket, safe="")
    query_pairs = [("list-type", "2"), ("prefix", prefix)]
    query = "&".join(f"{urllib.parse.quote(k, safe='')}={urllib.parse.quote(v, safe='')}" for k, v in query_pairs)
    # canonical query must be sorted by key
    query = "&".join(
        f"{urllib.parse.quote(k, safe='')}={urllib.parse.quote(v, safe='')}"
        for k, v in sorted(query_pairs)
    )
    url = f"{endpoint}{canonical_uri}?{query}"

    headers = {
        "host": host,
        "x-amz-content-sha256": payload_hash,
        "x-amz-date": amz_date,
    }
    signed_header_keys = sorted(headers.keys())
    canonical_headers = "".join(f"{k}:{headers[k].strip()}\n" for k in signed_header_keys)
    signed_headers = ";".join(signed_header_keys)
    canonical_request = "\n".join([
        "GET",
        canonical_uri,
        query,
        canonical_headers,
        signed_headers,
        payload_hash,
    ])
    scope = f"{date_stamp}/{region}/s3/aws4_request"
    string_to_sign = "\n".join([
        "AWS4-HMAC-SHA256",
        amz_date,
        scope,
        hashlib.sha256(canonical_request.encode()).hexdigest(),
    ])

    def _hm(k: bytes, m: str) -> bytes:
        return hmac.new(k, m.encode(), hashlib.sha256).digest()

    k_date = _hm(("AWS4" + sk).encode(), date_stamp)
    k_region = _hm(k_date, region)
    k_service = _hm(k_region, "s3")
    k_signing = _hm(k_service, "aws4_request")
    signature = hmac.new(k_signing, string_to_sign.encode(), hashlib.sha256).hexdigest()
    auth = f"AWS4-HMAC-SHA256 Credential={ak}/{scope}, SignedHeaders={signed_headers}, Signature={signature}"

    req = urllib.request.Request(url, method="GET")
    req.add_header("Authorization", auth)
    req.add_header("x-amz-date", amz_date)
    req.add_header("x-amz-content-sha256", payload_hash)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read()
    except urllib.error.HTTPError as e:
        print(f"  list error {prefix}: {e.code} {e.read()[:300]!r}")
        return []

    root = ET.fromstring(body)
    ns = {"s3": "http://s3.amazonaws.com/doc/2006-03-01/"}
    keys = []
    for contents in root.findall("s3:Contents", ns):
        k = contents.find("s3:Key", ns)
        if k is not None and k.text:
            keys.append(k.text)
    return keys


def copy_object(src_bucket: str, dst_bucket: str, key: str, env: dict) -> bool:
    import hashlib
    import hmac
    import datetime
    import urllib.parse

    region = "auto"
    endpoint = env["R2_S3_ENDPOINT"].rstrip("/")
    host = urllib.parse.urlparse(endpoint).hostname
    ak = env["R2_ACCESS_KEY_ID"]
    sk = env["R2_SECRET_ACCESS_KEY"]
    now = datetime.datetime.now(datetime.timezone.utc)
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    date_stamp = now.strftime("%Y%m%d")
    payload_hash = hashlib.sha256(b"").hexdigest()

    src_path = "/" + urllib.parse.quote(src_bucket, safe="") + "/" + "/".join(
        urllib.parse.quote(p, safe="") for p in key.split("/")
    )
    copy_source = f"{src_bucket}/{key}"
    # URL path is destination
    dst_path = "/" + urllib.parse.quote(dst_bucket, safe="") + "/" + "/".join(
        urllib.parse.quote(p, safe="") for p in key.split("/")
    )
    url = f"{endpoint}{dst_path}"

    headers = {
        "host": host,
        "x-amz-copy-source": urllib.parse.quote(copy_source, safe="/"),
        "x-amz-content-sha256": payload_hash,
        "x-amz-date": amz_date,
    }
    signed_header_keys = sorted(headers.keys())
    canonical_headers = "".join(f"{k}:{headers[k].strip()}\n" for k in signed_header_keys)
    signed_headers = ";".join(signed_header_keys)
    canonical_request = "\n".join([
        "PUT",
        dst_path,
        "",
        canonical_headers,
        signed_headers,
        payload_hash,
    ])
    scope = f"{date_stamp}/{region}/s3/aws4_request"
    string_to_sign = "\n".join([
        "AWS4-HMAC-SHA256",
        amz_date,
        scope,
        hashlib.sha256(canonical_request.encode()).hexdigest(),
    ])

    def _hm(k: bytes, m: str) -> bytes:
        return hmac.new(k, m.encode(), hashlib.sha256).digest()

    k_date = _hm(("AWS4" + sk).encode(), date_stamp)
    k_region = _hm(k_date, region)
    k_service = _hm(k_region, "s3")
    k_signing = _hm(k_service, "aws4_request")
    signature = hmac.new(k_signing, string_to_sign.encode(), hashlib.sha256).hexdigest()
    auth = f"AWS4-HMAC-SHA256 Credential={ak}/{scope}, SignedHeaders={signed_headers}, Signature={signature}"

    req = urllib.request.Request(url, data=b"", method="PUT")
    req.add_header("Authorization", auth)
    req.add_header("x-amz-date", amz_date)
    req.add_header("x-amz-content-sha256", payload_hash)
    req.add_header("x-amz-copy-source", headers["x-amz-copy-source"])
    last_err = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.status in (200, 201)
        except urllib.error.HTTPError as e:
            print(f"  copy fail {key}: {e.code} {e.read()[:200]!r}")
            return False
        except Exception as e:
            last_err = e
            import time
            time.sleep(1 + attempt)
    print(f"  copy fail {key}: {last_err}")
    return False


def delete_object(bucket: str, key: str, env: dict) -> bool:
    status, _ = s3_request("DELETE", bucket, key, env)
    return status in (204, 200, 404)


def main() -> None:
    env = load_env()
    pub = env.get("R2_BUCKET", "resolveao-media")
    priv = env.get("R2_PRIVATE_BUCKET", "resolveao-private")
    total_copied = 0
    total_deleted = 0
    total_failed = 0

    for prefix in PREFIXES:
        keys = list_keys(pub, prefix, env)
        print(f"[{pub}] {prefix} -> {len(keys)} objects")
        for key in keys:
            if DRY:
                print(f"  DRY would migrate: {key}")
                continue
            # object already in private → just delete from public if present
            st, _ = s3_request("HEAD", priv, key, env)
            already = st == 200
            if not already and not copy_object(pub, priv, key, env):
                total_failed += 1
                continue
            if delete_object(pub, key, env):
                total_copied += 1 if not already else 0
                total_deleted += 1
                print(f"  migrated: {key}" + (" (already copied)" if already else ""))
            else:
                total_failed += 1
                print(f"  copied but delete failed: {key}")

    print(f"\nDone. copied+deleted={total_copied} failed={total_failed} dry_run={DRY}")


if __name__ == "__main__":
    main()
