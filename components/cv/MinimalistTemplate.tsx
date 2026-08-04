import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { TemplateSharedProps } from './CVTemplateSelector';
import '../../styles/cv-templates.css';

export const MinimalistTemplate: React.FC<TemplateSharedProps> = ({ cv, educationFirst }) => {

    const renderExperience = () => {
        if (!cv.experiences || cv.experiences.length === 0) return null;
        return (
            <div>
                <h2 className="min-section-title">Experiência</h2>
                <div>
                    {cv.experiences.map(exp => (
                        <div key={exp.id} className="min-item">
                            <div className="min-item-left">
                                <div className="min-item-company">{exp.company}</div>
                                <div className="min-item-date">{exp.startDate} – {exp.isCurrent ? 'Presente' : exp.endDate}</div>
                            </div>
                            <div className="min-item-right">
                                <h3 className="min-item-role">{exp.role}</h3>
                                {exp.description && (
                                    <div className="min-item-desc">{exp.description}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderEducation = () => {
        if (!cv.education || cv.education.length === 0) return null;
        return (
            <div>
                <h2 className="min-section-title">Formação</h2>
                <div>
                    {cv.education.map(edu => (
                        <div key={edu.id} className="min-item">
                            <div className="min-item-left">
                                <div className="min-item-company">{edu.school}</div>
                                <div className="min-item-date">{edu.year}</div>
                            </div>
                            <div className="min-item-right">
                                <h3 className="min-item-role">{edu.degree}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Centered Executive Header
    const renderExecutiveHeader = () => (
        <div className="executive-header">
            <h1 className="executive-name">{cv.fullName || 'Seu Nome'}</h1>
            {cv.title && <div className="executive-title">{cv.title}</div>}
            {(cv.email || cv.phone || cv.location) && (
                <div className="executive-contacts">
                    {cv.phone && (
                        <span className="executive-contact">
                            <Phone size={14} /> {cv.phone}
                        </span>
                    )}
                    {cv.email && (
                        <span className="executive-contact">
                            <Mail size={14} /> {cv.email}
                        </span>
                    )}
                    {cv.location && (
                        <span className="executive-contact">
                            <MapPin size={14} /> {cv.location}
                        </span>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="cv-template-container">
            {/* Centered Executive Header */}
            {renderExecutiveHeader()}

            {/* Sidebar (Dark Blue/Left) */}
            <div className="min-sidebar">
                {/* Contactos */}
                {(cv.email || cv.phone || cv.location) && (
                    <div>
                        <h2 className="min-sidebar-title">Contacto</h2>
                        {cv.phone && (
                            <div className="min-contact-item">
                                <Phone size={14} className="min-contact-icon" />
                                {cv.phone}
                            </div>
                        )}
                        {cv.email && (
                            <div className="min-contact-item">
                                <Mail size={14} className="min-contact-icon" />
                                <span className="min-email-text">{cv.email}</span>
                            </div>
                        )}
                        {cv.location && (
                            <div className="min-contact-item">
                                <MapPin size={14} className="min-contact-icon" />
                                {cv.location}
                            </div>
                        )}
                    </div>
                )}

                {/* Skills */}
                {cv.skills && cv.skills.length > 0 && (
                    <div>
                        <h2 className="min-sidebar-title">Especialidades</h2>
                        <div className="min-skills-list">
                            {cv.skills.map((skill, i) => (
                                <div key={i} className="min-skill-item">
                                    {skill}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="min-main">
                {/* Perfil / Summary */}
                {cv.summary && (
                    <div className="min-summary">
                        <p>{cv.summary}</p>
                    </div>
                )}

                {/* Main Sections */}
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
