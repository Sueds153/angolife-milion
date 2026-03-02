import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { CVData } from '../types';

// Register fonts if needed (using standard ones for compatibility)
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2' }, // Normal
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2', fontWeight: 'bold' } // Bold
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica', // Inter might have issues loading sometimes, Helvetica is a safe fallback
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#fbbf24',
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 12,
    color: '#fbbf24',
    fontWeight: 'bold',
    marginTop: 2,
  },
  contact: {
    marginTop: 5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginLeft: 20,
  },
  section: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 3,
    marginBottom: 8,
  },
  experienceItem: {
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontWeight: 'bold',
    color: '#1e293b',
  },
  itemSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#64748b',
    fontSize: 9,
    marginBottom: 3,
  },
  description: {
    textAlign: 'justify',
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  skill: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
  }
});

interface CVDocumentProps {
  data: CVData;
}

export const CVDocument: React.FC<CVDocumentProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{data.fullName || 'Seu Nome'}</Text>
          <Text style={styles.title}>{data.title || 'Título Profissional'}</Text>
          <View style={styles.contact}>
            {data.email && <Text>Email: {data.email}</Text>}
            {data.phone && <Text>Telefone: {data.phone}</Text>}
            {data.location && <Text>Local: {data.location}</Text>}
          </View>
        </View>
        {data.photoUrl && (
          <Image src={data.photoUrl} style={styles.photo} />
        )}
      </View>

      {/* Summary */}
      {data.summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo Profissional</Text>
          <Text style={styles.description}>{data.summary}</Text>
        </View>
      )}

      {/* Experience */}
      {data.experiences.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experiência Profissional</Text>
          {data.experiences.map((exp, i) => (
            <View key={i} style={styles.experienceItem}>
              <View style={styles.itemHeader}>
                <Text style={{ fontWeight: 'bold' }}>{exp.role}</Text>
                <Text>{exp.company}</Text>
              </View>
              <View style={styles.itemSubHeader}>
                <Text>{exp.startDate} - {exp.isCurrent ? 'Atual' : exp.endDate}</Text>
              </View>
              <Text style={styles.description}>{exp.description}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Formação Académica</Text>
          {data.education.map((edu, i) => (
            <View key={i} style={styles.experienceItem}>
              <View style={styles.itemHeader}>
                <Text style={{ fontWeight: 'bold' }}>{edu.degree}</Text>
                <Text>{edu.year}</Text>
              </View>
              <Text>{edu.school}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Competências</Text>
          <View style={styles.skills}>
            {data.skills.map((skill, i) => (
              <View key={i} style={styles.skill}>
                <Text>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Page>
  </Document>
);
