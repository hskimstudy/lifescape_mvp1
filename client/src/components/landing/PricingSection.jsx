import React from 'react';
import { PRICING_DATA } from './constants';

const PricingSection = ({ onContactOpen }) => {
    return (
        <section className="pricing-section-v3" id="pricing">
            <div className="pricing-white-container">
                <div className="section-header animate-fade-up">
                    <h2 className="pricing-heading">가장 합리적인 서비스,<br />지금 <span className="underline-accent" style={{ color: '#3b82f6' }}>할인된 가격</span>으로 만나 보세요.</h2>
                </div>

                <div className="pricing-cards-row">
                    {PRICING_DATA.map((plan, index) => (
                        <div
                            className={`pricing-card-v4 ${plan.isEnterprise ? 'enterprise' : ''} animate-fade-up`}
                            style={{ animationDelay: `${0.2 + index * 0.2}s` }}
                            key={plan.id}
                        >
                            {plan.id === 'pro' && <div className="enterprise-badge" style={{ position: 'absolute', top: '16px', right: '16px', background: '#C8E600', color: '#111', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>Popular</div>}
                            <div className="plan-emoji">{plan.icon}</div>
                            <h3 className="plan-name">{plan.name}</h3>
                            <div className="plan-price-wrap">
                                {plan.originalPrice && (
                                    <span className="plan-original-price">{plan.originalPrice}</span>
                                )}
                                <span className="plan-price">{plan.price}</span>
                            </div>

                            <ul className="plan-features">
                                {plan.features.map((feature, fIdx) => (
                                    <li key={fIdx} className={feature.active ? 'active' : 'inactive'} style={!feature.active ? { color: 'rgba(255,255,255,0.3)' } : {}}>
                                        {feature.active ? '✓' : '—'} {feature.bold ? <strong>{feature.text}</strong> : feature.text}
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`plan-btn-v3`}
                                style={{ background: '#fff', color: plan.isEnterprise ? '#3b82f6' : '#111', borderColor: '#e5e7eb', fontWeight: 'bold' }}
                                onClick={plan.isEnterprise ? onContactOpen : undefined}
                            >
                                {plan.isEnterprise ? '플랜 문의하기' : '플랜 결제하기'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PricingSection;
