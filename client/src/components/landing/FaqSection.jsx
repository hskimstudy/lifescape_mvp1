import React from 'react';
import { FAQ_DATA } from './constants';

const FaqSection = ({ expandedFaq, toggleFaq }) => {
    return (
        <section className="faq-section-v3" id="faq">
            <span className="faq-label animate-fade-up" style={{ color: '#C8E600', fontWeight: 'bold' }}>FAQ</span>
            <h2 className="faq-heading animate-fade-up">잇다 고객이 자주 묻는 질문들</h2>
            <div className="faq-list-v3" style={{ marginTop: '40px' }}>
                {FAQ_DATA.map((faq, index) => (
                    <div className={`faq-item-v3 animate-fade-up`} style={{ animationDelay: `${0.2 + index * 0.1}s`, background: '#fff', borderRadius: '12px', marginBottom: '16px', padding: '0', overflow: 'hidden' }} key={faq.id}>
                        <div className="faq-q-v3" onClick={() => toggleFaq(faq.id)} style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <div className="faq-toggle" style={{ color: '#111', fontSize: '1.2rem', fontWeight: 'bold', marginRight: '16px' }}>{expandedFaq === faq.id ? '−' : '+'}</div>
                            <div className="faq-q-text" style={{ color: '#111', fontWeight: 700, fontSize: '1rem' }}>{faq.q}</div>
                        </div>
                        {expandedFaq === faq.id && (
                            <div className="faq-a-content" style={{ padding: '0 24px 24px 50px', color: '#666', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{faq.a}</div>
                        )}
                    </div>
                ))}
            </div>
            <div className="faq-more-action animate-fade-up" style={{ textAlign: 'center', marginTop: '40px' }}>
                <button className="start-btn-large" style={{ background: '#C8E600', color: '#111', fontWeight: 'bold', padding: '16px 40px', borderRadius: '40px', fontSize: '1.1rem' }}>더 많은 문의 바로가기</button>
            </div>
        </section>
    );
};

export default FaqSection;
