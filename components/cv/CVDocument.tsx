import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { CVData } from '../../types';
import { CVTemplateType } from './CVTemplateSelector';

// ── Utils ─────────────────────────────────────────────
const fmt = (v: string, fallback = '') => (v?.trim() || fallback);

/** Formata uma data MM/AAAA para “MM/AAAA – Atual” / “MM/AAAA” */
const fmtExpDate = (start: string, isCurrent: boolean, end: string) => {
  const s = fmt(start, '—');
  if (isCurrent) return `${s} – Atual`;
  return `${s} – ${fmt(end, '')}`.replace(/ – -/g, ' – ').replace(/^ –/, '');
};

// ── Factory de estilos ATS (coluna única, seções predefinidas) ─────────────────
const buildStyles = (accent: string, nameColor: string, accentMid: string) =>
  StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: 'Helvetica',
      fontSize: 10,
      color: '#334155',
      lineHeight: 1.45,
    },
    header: {
      marginBottom: 14,
      paddingBottom: 10,
      borderBottomWidth: 2,
      borderBottomColor: accent,
      alignItems: 'flex-start',
    },
    headerLeft: { flex: 1, alignItems: 'flex-start', textAlign: 'left' },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
      color: nameColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    title: { fontSize: 12, fontWeight: 'bold', color: accent, marginTop: 2 },
    contact: {
      marginTop: 6,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'flex-start',
      fontSize: 9,
      color: '#475569',
    },
    contactGroup: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      alignItems: 'center',
      fontSize: 9,
      color: '#475569',
    },
    contactLabel: {
      fontSize: 7.5,
      fontWeight: 'bold',
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    contactValue: {
      fontSize: 9,
      color: '#1e293b',
    },
    section: { marginTop: 16 },
    sectionTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      color: nameColor,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    experienceItem: { marginBottom: 10 },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontWeight: 'bold',
      color: '#1e293b',
      gap: 6,
    },
    itemHeaderRight: { textAlign: 'right' },
    itemSubHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      color: '#64748b',
      fontSize: 9,
      marginBottom: 3,
      gap: 6,
    },
    itemSubHeaderRight: { textAlign: 'right' },
    description: { textAlign: 'justify' },
    descriptionBold: { fontWeight: 'bold' },
    skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    skill: {
      backgroundColor: '#f8fafc',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 3,
      borderWidth: 0.5,
      borderColor: '#e2e8f0',
    },
    noContent: { color: '#94a3b8', fontSize: 9, fontStyle: 'italic' },
    watermark: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      fontSize: 64,
      fontWeight: 'bold',
      color: '#fbbf24',
      opacity: 0.05,
      transform: 'rotate(-35deg)',
      letterSpacing: 6,
      textAlign: 'center',
    },
    footer: {
      position: 'absolute',
      bottom: 20,
      left: 40,
      right: 40,
      fontSize: 8,
      color: '#94a3b8',
      textAlign: 'center',
    },
  });

// ── Template: Clássico ──────────────────────────────────
const classicStyles = buildStyles('#b45309', '#0f172a', '#b45309');
const ClassicDoc: React.FC<{ data: CVData }> = ({ data }) => (
  <>
    <View style={[classicStyles.header, classicStyles.headerLeft]}>
      <View>
        <Text style={[classicStyles.name]}>{fmt(data.fullName, 'Nome Completo')}</Text>
        {fmt(data.title, 'Título Profissional') ? <Text style={[classicStyles.title]}>{fmt(data.title, 'Título Profissional')}</Text> : null}
        <View style={[classicStyles.contact]}>
          {fmt(data.email, '') ? <Text>{fmt(data.email, '')}</Text> : null}
          {fmt(data.phone, '') ? <Text>{fmt(data.phone, '')}</Text> : null}
          {fmt(data.location, '') ? <Text>{fmt(data.location, '')}</Text> : null}
        </View>
      </View>
    </View>
    <View style={[classicStyles.section]}>
      <Text style={[classicStyles.sectionTitle]}>Resumo Profissional</Text>
      {fmt(data.summary, '') ? <Text style={[classicStyles.description]}>{fmt(data.summary, '')}</Text> : null}
    </View>
    <View style={[classicStyles.section]}>
      <Text style={[classicStyles.sectionTitle]}>Experiência Profissional</Text>
      {data.experiences.map((exp, i) => (
        <View key={i} style={[classicStyles.experienceItem]}>
          <View style={[classicStyles.itemHeader]}>
            <Text style={[classicStyles.itemHeaderRight]}>{exp.role || '(Cargo)'}</Text>
          </View>
          <View style={[classicStyles.itemSubHeader]}>
            <Text>{fmtExpDate(exp.startDate, exp.isCurrent, exp.endDate)}</Text>
          </View>
          {fmt(exp.description, '') ? <Text style={[classicStyles.description]}>{fmt(exp.description, '')}</Text> : null}
        </View>
      ))}
    </View>
    <View style={[classicStyles.section]}>
      <Text style={[classicStyles.sectionTitle]}>Formação Académica</Text>
      {data.education.map((edu, i) => (
        <View key={i} style={[classicStyles.experienceItem]}>
          <View style={[classicStyles.itemHeader]}>
            <Text style={[classicStyles.itemHeaderRight]}>{edu.degree || '(Grau)'}</Text>
            <Text style={[classicStyles.itemHeaderRight]}>{edu.year || '—'}</Text>
          </View>
          <Text>{fmt(edu.school, '')}</Text>
        </View>
      ))}
    </View>
    <View style={[classicStyles.section]}>
      <Text style={[classicStyles.sectionTitle]}>Competências</Text>
      <View style={[classicStyles.skills]}>
        {data.skills.map((skill, i) => <Text key={i} style={[classicStyles.skill]}>{skill}</Text>)}
      </View>
    </View>
  </>
);

// ── Template: Moderno (azul marinho) ───────────────────
const modernStyles = buildStyles('#1e3a8a', '#0f172a', '#1e3a8a');
const ModernDoc: React.FC<{ data: CVData }> = ({ data }) => (
  <>
    <View style={[modernStyles.header, modernStyles.headerLeft]}>
      <View>
        <Text style={[modernStyles.name]}>{fmt(data.fullName, 'Nome Completo')}</Text>
        {fmt(data.title, 'Título Profissional') ? <Text style={[modernStyles.title]}>{fmt(data.title, 'Título Profissional')}</Text> : null}
        <View style={[modernStyles.contact]}>
          {fmt(data.email, '') ? <Text>{fmt(data.email, '')}</Text> : null}
          {fmt(data.phone, '') ? <Text>{fmt(data.phone, '')}</Text> : null}
          {fmt(data.location, '') ? <Text>{fmt(data.location, '')}</Text> : null}
        </View>
      </View>
    </View>
    <View style={[modernStyles.section]}>
      <Text style={[modernStyles.sectionTitle]}>Resumo Profissional</Text>
      {fmt(data.summary, '') ? <Text style={[modernStyles.description]}>{fmt(data.summary, '')}</Text> : null}
    </View>
    <View style={[modernStyles.section]}>
      <Text style={[modernStyles.sectionTitle]}>Experiência Profissional</Text>
      {data.experiences.map((exp, i) => (
        <View key={i} style={[modernStyles.experienceItem]}>
          <View style={[modernStyles.itemHeader]}>
            <Text style={[modernStyles.itemHeaderRight]}>{exp.role || '(Cargo)'}</Text>
            <Text style={[modernStyles.itemHeaderRight]}>{fmtExpDate(exp.startDate, exp.isCurrent, exp.endDate)}</Text>
          </View>
          <Text style={[modernStyles.itemSubHeader]}>{exp.company || '(Empresa)'}</Text>
          {fmt(exp.description, '') ? <Text style={[modernStyles.description]}>{fmt(exp.description, '')}</Text> : null}
        </View>
      ))}
    </View>
    <View style={[modernStyles.section]}>
      <Text style={[modernStyles.sectionTitle]}>Formação Académica</Text>
      {data.education.map((edu, i) => (
        <View key={i} style={[modernStyles.experienceItem]}>
          <View style={[modernStyles.itemHeader]}>
            <Text style={[modernStyles.itemHeaderRight]}>{edu.degree || '(Grau)'}</Text>
            <Text style={[modernStyles.itemHeaderRight]}>{fmt(edu.year, '—')}</Text>
          </View>
          <Text style={[modernStyles.itemSubHeader]}>{fmt(edu.school, '')}</Text>
        </View>
      ))}
    </View>
    <View style={[modernStyles.section]}>
      <Text style={[modernStyles.sectionTitle]}>Competências</Text>
      <View style={[modernStyles.skills]}>
        {data.skills.map((skill, i) => <Text key={i} style={[modernStyles.skill]}>{skill}</Text>)}
      </View>
    </View>
  </>
);

// ── Template: Minimalista ───────────────────────────────
const minimalistStyles = buildStyles('#111827', '#111827', '#111827');
const MinimalistDoc: React.FC<{ data: CVData }> = ({ data }) => (
  <>
    <View style={[minimalistStyles.header, minimalistStyles.headerLeft]}>
      <View>
        <Text style={[minimalistStyles.name]}>{fmt(data.fullName, 'Nome Completo')}</Text>
        {fmt(data.title, 'Título Profissional') ? <Text style={[minimalistStyles.title]}>{fmt(data.title, 'Título Profissional')}</Text> : null}
        <View style={[minimalistStyles.contact]}>
          {fmt(data.email, '') ? <Text>{fmt(data.email, '')}</Text> : null}
          {fmt(data.phone, '') ? <Text>{fmt(data.phone, '')}</Text> : null}
          {fmt(data.location, '') ? <Text>{fmt(data.location, '')}</Text> : null}
        </View>
      </View>
    </View>
    <View style={[minimalistStyles.section]}>
      <Text style={[minimalistStyles.sectionTitle]}>Resumo Profissional</Text>
      {fmt(data.summary, '')} && <Text style={[minimalistStyles.description]}>{fmt(data.summary, '')}</Text>
    </View>
    <View style={[minimalistStyles.section]}>
      <Text style={[minimalistStyles.sectionTitle]}>Experiência Profissional</Text>
      {data.experiences.map((exp, i) => (
        <View key={i} style={[minimalistStyles.experienceItem]}>
          <View style={[minimalistStyles.itemHeader]}>
            <Text style={[minimalistStyles.itemHeaderRight]}>{exp.role || '(Cargo)'}</Text>
            <Text style={[minimalistStyles.itemHeaderRight]}>{fmtExpDate(exp.startDate, exp.isCurrent, exp.endDate)}</Text>
          </View>
          <Text style={[minimalistStyles.itemSubHeader]}>{exp.company || '(Empresa)'}</Text>
          {fmt(exp.description, '') ? <Text style={[minimalistStyles.description]}>{fmt(exp.description, '')}</Text> : null}
        </View>
      ))}
    </View>
    <View style={[minimalistStyles.section]}>
      <Text style={[minimalistStyles.sectionTitle]}>Formação Académica</Text>
      {data.education.map((edu, i) => (
        <View key={i} style={[minimalistStyles.experienceItem]}>
          <View style={[minimalistStyles.itemHeader]}>
            <Text style={[minimalistStyles.itemHeaderRight]}>{edu.degree || '(Grau)'}</Text>
            <Text style={[minimalistStyles.itemHeaderRight]}>{fmt(edu.year, '—')}</Text>
          </View>
          <Text style={[minimalistStyles.itemSubHeader]}>{fmt(edu.school, '')}</Text>
        </View>
      ))}
    </View>
    <View style={[minimalistStyles.section]}>
      <Text style={[minimalistStyles.sectionTitle]}>Competências</Text>
      <View style={[minimalistStyles.skills]}>
        {data.skills.map((skill, i) => <Text key={i} style={[minimalistStyles.skill]}>{skill}</Text>)}
      </View>
    </View>
  </>
);

// ── Template: Técnico ───────────────────────────────────
const technicalStyles = buildStyles('#1d4ed8', '#0f172a', '#1d4ed8');
const TechnicalDoc: React.FC<{ data: CVData }> = ({ data }) => (
  <>
    <View style={[technicalStyles.header, technicalStyles.headerLeft]}>
      <View>
        <Text style={[technicalStyles.name]}>{fmt(data.fullName, 'Nome Completo')}</Text>
        {fmt(data.title, 'Título Profissional') ? <Text style={[technicalStyles.title]}>{fmt(data.title, 'Título Profissional')}</Text> : null}
        <View style={[technicalStyles.contact]}>
          {fmt(data.email, '') ? <Text>{fmt(data.email, '')}</Text> : null}
          {fmt(data.phone, '') ? <Text>{fmt(data.phone, '')}</Text> : null}
          {fmt(data.location, '') ? <Text>{fmt(data.location, '')}</Text> : null}
        </View>
      </View>
    </View>
    <View style={[technicalStyles.section]}>
      <Text style={[technicalStyles.sectionTitle]}>Resumo Profissional</Text>
      {fmt(data.summary, '')} && <Text style={[technicalStyles.description]}>{fmt(data.summary, '')}</Text>
    </View>
    <View style={[technicalStyles.section]}>
      <Text style={[technicalStyles.sectionTitle]}>Competências</Text>
      <View style={[technicalStyles.skills]}>
        {data.skills.map((skill, i) => <Text key={i} style={[technicalStyles.skill]}>{skill}</Text>)}
      </View>
    </View>
    <View style={[technicalStyles.section]}>
      <Text style={[technicalStyles.sectionTitle]}>Experiência Profissional</Text>
      {data.experiences.map((exp, i) => (
        <View key={i} style={[technicalStyles.experienceItem]}>
          <View style={[technicalStyles.itemHeader]}>
            <Text style={[technicalStyles.itemHeaderRight]}>{exp.role || '(Cargo)'}</Text>
            <Text style={[technicalStyles.itemHeaderRight]}>{fmtExpDate(exp.startDate, exp.isCurrent, exp.endDate)}</Text>
          </View>
          <Text style={[technicalStyles.itemSubHeader]}>{exp.company || '(Empresa)'}</Text>
          {fmt(exp.description, '') ? <Text style={[technicalStyles.description]}>{fmt(exp.description, '')}</Text> : null}
        </View>
      ))}
    </View>
    <View style={[technicalStyles.section]}>
      <Text style={[technicalStyles.sectionTitle]}>Formação Académica</Text>
      {data.education.map((edu, i) => (
        <View key={i} style={[technicalStyles.experienceItem]}>
          <View style={[technicalStyles.itemHeader]}>
            <Text style={[technicalStyles.itemHeaderRight]}>{edu.degree || '(Grau)'}</Text>
            <Text style={[technicalStyles.itemHeaderRight]}>{fmt(edu.year, '—')}</Text>
          </View>
          <Text style={[technicalStyles.itemSubHeader]}>{fmt(edu.school, '')}</Text>
        </View>
      ))}
    </View>
  </>
);

// ── Factory de renderização ─────────────────────────────
type DocRenderer = (props: { data: CVData }) => React.ReactNode;

const REGISTRY: Record<CVTemplateType, { component: DocRenderer }> = {
  classic: { component: ClassicDoc },
  modern: { component: ModernDoc },
  minimalist: { component: MinimalistDoc },
  technical: { component: TechnicalDoc },
};

// ── Documento principal ────────────────────────────────
export interface CVDocumentProps {
  data: CVData;
  template?: CVTemplateType;
  educationFirst?: boolean;
  showWatermark?: boolean;
}

export const CVDocument: React.FC<CVDocumentProps> = ({
  data,
  template = 'classic',
  educationFirst = false,
  showWatermark = false,
}) => {
  const renderer = REGISTRY[template]?.component ?? REGISTRY.classic.component;

  return (
    <Document>
      <Page size="A4" style={buildStyles('#b45309', '#0f172a', '#b45309').page}>
        <View>
          {renderer({ data })}
        </View>
        {showWatermark && <Text style={buildStyles('#fbbf24', '#0f172a', '#fbbf24').watermark} fixed>Resolve.AO</Text>}
        <Text style={buildStyles('#111827', '#0f172a', '#111827').footer} fixed>Gerado com Resolve.AO · resolve.ao</Text>
      </Page>
    </Document>
  );
};
