import React from 'react';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { TemplateSharedProps } from './CVTemplateSelector';
import '../../styles/cv-templates.css';

export const TechnicalTemplate: React.FC<TemplateSharedProps> = ({ cv, educationFirst }) => {
    // Only render Experience section if there is at least one experience
    const renderExperience = () => {
        if (!cv.experiences || cv.experiences.length === 0) return null;

        return (
            <div>
                <h2 className="creative-section-title">Experiências Profissionais</h2>
                <div>
                    {cv.experiences.map(exp => (
                        <div key={exp.id} className="creative-item">
                            <div className="creative-item-header">
                                <h3 className="creative-item-title">{exp.role}</h3>
                                <span className="creative-item-date">{exp.startDate} - {exp.isCurrent ? 'Presente' : exp.endDate}</span>
                            </div>
                            <div className="creative-item-subtitle">{exp.company}</div>
                            {exp.description && (
                                <p className="creative-item-desc">{exp.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Only render Education section if there is at least one education entry
    const renderEducation = () => {
        if (!cv.education || cv.education.length === 0) return null;

        return (
            <div>
                <h2 className="creative-section-title">Formações</h2>
                <div>
                    {cv.education.map(edu => (
                        <div key={edu.id} className="creative-item">
                            <div className="creative-item-header">
                                <h3 className="creative-item-title">{edu.degree}</h3>
                                <span className="creative-item-date">{edu.year}</span>
                            </div>
                            <div className="creative-item-subtitle">{edu.school}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="cv-template-container">
            {/* Sidebar (30% with gradient and rounded corners) */}
            <div className="creative-sidebar">
                <div className="creative-photo-container">
                    {cv.photoUrl ? (
                        <img src={cv.photoUrl} alt="Foto de Perfil" />
                    ) : (
                        <div className="creative-photo-fallback" />
                    )}
                </div>

                {/* Contactos */}
                {(cv.email || cv.phone || cv.location) && (
                    <div>
                        <h2 className="creative-sidebar-title">Coordenadas</h2>
                        {cv.phone && (
                            <div className="creative-contact-item">
                                <Phone size={16} />
                                <span>{cv.phone}</span>
                            </div>
                        )}
                        {cv.email && (
                            <div className="creative-contact-item">
                                <Mail size={16} />
                                <span className="creative-contact-email">{cv.email}</span>
                            </div>
                        )}
                        {cv.location && (
                            <div className="creative-contact-item">
                                <MapPin size={16} />
                                <span>{cv.location}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Competências */}
                {cv.skills && cv.skills.length > 0 && (
                    <div>
                        <h2 className="creative-sidebar-title">Qualidades</h2>
                        <ul className="creative-skills-list">
                            {cv.skills.map((skill, i) => (
                                <li key={i}>{skill}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Main Content (70%) */}
            <div className="creative-main">
                <div className="creative-header">
                    <h1 className="creative-name">{cv.fullName || 'Seu Nome'}</h1>
                    <div className="creative-role">{cv.title || 'Profissional Especializado'}</div>
                </div>

                {/* Sobre Mim / Resumo Profissional */}
                {cv.summary && (
                    <div className="creative-summary">
                        <p>{cv.summary}</p>
                    </div>
                )}

                {/* Render Sections in preferred order */}
                {educationFirst ? (
                    <>
                        {renderEducation()}
                        {renderExperience()}
                    </>
                ) : (
                    <>
                        {renderExperience()}
                        {renderEducation()}
                    </>
                )}
            </div>
        </div>
    );
};
