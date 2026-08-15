import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { TemplateSharedProps } from './CVTemplateSelector';
import '../../styles/cv-templates.css';

export const ClassicTemplate: React.FC<TemplateSharedProps> = ({ cv, educationFirst }) => {
    // Left column content (Sidebar in body row)
    const renderSidebar = () => {
        return (
            <div className="classic-sidebar">
                {/* Summary */}
                {cv.summary && (
                    <div>
                        <h2 className="classic-section-title">Sobre Mim</h2>
                        <div className="classic-summary-text">{cv.summary}</div>
                    </div>
                )}

                {/* Skills */}
                {cv.skills && cv.skills.length > 0 && (
                    <div>
                        <h2 className="classic-section-title">Habilidades</h2>
                        <ul className="classic-skill-list">
                            {cv.skills.map((skill, i) => (
                                <li key={i}>{skill}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    // Right column content (Main in body row)
    const renderExperience = () => {
        if (!cv.experiences || cv.experiences.length === 0) return null;
        return (
            <div>
                <h2 className="classic-section-title">Experiência Profissional</h2>
                <div>
                    {cv.experiences.map(exp => (
                        <div key={exp.id} className="classic-item">
                            <h3 className="classic-item-role">{exp.role}</h3>
                            <div className="classic-item-company">{exp.company}</div>
                            <div className="classic-item-date">{exp.startDate} – {exp.isCurrent ? 'Presente' : exp.endDate}</div>
                            {exp.description && (
                                <div className="classic-item-desc">{exp.description}</div>
                            )}
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
                <h2 className="classic-section-title">Formação Acadêmica</h2>
                <div>
                    {cv.education.map(edu => (
                        <div key={edu.id} className="classic-item">
                            <h3 className="classic-item-role">{edu.degree}</h3>
                            <div className="classic-item-company">{edu.school}</div>
                            <div className="classic-item-date">{edu.year}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Centered Executive Header
    const renderExecutiveHeader = () => (
        <div className="executive-header">
            <h1 className="executive-name">{cv.fullName || 'Nome Completo'}</h1>
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
            <div className="classic-wrapper">
                {/* Centered Executive Header (replaces old header-row with photo) */}
                {renderExecutiveHeader()}

                {/* Body 2 Columns */}
                <div className="classic-body-row">
                    {/* Left Column (Summary, Skills) */}
                    {renderSidebar()}

                    {/* Right Column (Experience, Education) */}
                    <div className="classic-main">
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
            </div>
        </div>
    );
};
