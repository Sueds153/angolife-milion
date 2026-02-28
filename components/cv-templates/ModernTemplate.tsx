import React from 'react';
import { Mail, Phone, MapPin, User, Linkedin, Globe } from 'lucide-react';
import { TemplateSharedProps } from './CVTemplateSelector';
import '../../styles/cv-templates.css';

export const ModernTemplate: React.FC<TemplateSharedProps> = ({ cv, educationFirst }) => {
    // Only render Experience section if there is at least one experience
    const renderExperience = () => {
        if (!cv.experiences || cv.experiences.length === 0) return null;

        return (
            <div className="modern-section">
                <h2 className="modern-section-title">Experiência Profissional</h2>
                <div className="modern-section-content">
                    {cv.experiences.map(exp => (
                        <div key={exp.id} className="modern-item">
                            <div className="modern-item-header">
                                <h3 className="modern-item-title">{exp.role}</h3>
                                <span className="modern-item-date">{exp.startDate} - {exp.isCurrent ? 'Presente' : exp.endDate}</span>
                            </div>
                            <div className="modern-item-subtitle">{exp.company}</div>
                            {exp.description && (
                                <p className="modern-item-desc">{exp.description}</p>
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
            <div className="modern-section">
                <h2 className="modern-section-title">Formação Académica</h2>
                <div className="modern-section-content">
                    {cv.education.map(edu => (
                        <div key={edu.id} className="modern-item">
                            <div className="modern-item-header">
                                <h3 className="modern-item-title">{edu.degree}</h3>
                                <span className="modern-item-date">{edu.year}</span>
                            </div>
                            <div className="modern-item-subtitle">{edu.school}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="cv-template-container">
            {/* Sidebar (30%) */}
            <div className="modern-sidebar">
                <div className="modern-photo-container">
                    {cv.photoUrl ? (
                        <img src={cv.photoUrl} alt="Foto de Perfil" />
                    ) : (
                        <User size={64} color="#1a237e" />
                    )}
                </div>

                {/* Contactos */}
                {(cv.email || cv.phone || cv.location) && (
                    <div>
                        <h2 className="modern-sidebar-title">Contactos</h2>
                        {cv.phone && (
                            <div className="modern-contact-item">
                                <Phone size={16} />
                                <span>{cv.phone}</span>
                            </div>
                        )}
                        {cv.email && (
                            <div className="modern-contact-item">
                                <Mail size={16} />
                                <span>{cv.email}</span>
                            </div>
                        )}
                        {cv.location && (
                            <div className="modern-contact-item">
                                <MapPin size={16} />
                                <span>{cv.location}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Competências */}
                {cv.skills && cv.skills.length > 0 && (
                    <div>
                        <h2 className="modern-sidebar-title">Habilidades</h2>
                        <div className="modern-skills-container">
                            {cv.skills.map((skill, i) => (
                                <span key={i} className="modern-skill-tag">{skill}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content (70%) */}
            <div className="modern-main">
                <div className="modern-header">
                    <h1 className="modern-name">{cv.fullName || 'Seu Nome'}</h1>
                    {/* Title / Role */}
                    {cv.title && <div className="modern-role">{cv.title}</div>}
                </div>

                {/* Sobre Mim */}
                {cv.summary && (
                    <div className="modern-section">
                        <h2 className="modern-section-title">Sobre Mim</h2>
                        <p className="modern-summary">{cv.summary}</p>
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
