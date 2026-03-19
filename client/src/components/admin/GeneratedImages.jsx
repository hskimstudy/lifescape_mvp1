import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { dbFetch } from '../../dbHelper';

const GeneratedImages = () => {
    const context = useOutletContext();
    const searchQuery = context?.searchQuery || '';
    const session = context?.session;
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [zoomedImage, setZoomedImage] = useState(null);

    const fetchImages = async () => {
        setLoading(true);
        console.log("Admin: Fetching generated images via dbFetch...");

        try {
            const { data, error } = await dbFetch('generations', {
                select: '*,profiles(*)',
                order: 'created_at.desc',
                token: session?.access_token
            });

            if (error) {
                console.error('Admin: Error fetching generated images:', error);
                setImages([]);
            } else {
                console.log(`Admin: Successfully fetched ${data?.length || 0} images.`);
                setImages(data || []);
            }
        } catch (err) {
            console.error("Admin: Fetch exception:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const filteredImages = useMemo(() => {
        if (!searchQuery) return images;
        const query = searchQuery.toLowerCase();

        return images.filter(img => {
            const promptContent = (img.prompt || '').toLowerCase();
            const styleContent = (img.style || '').toLowerCase();
            const emailContent = (img.profiles?.email || '알 수 없는 사용자').toLowerCase();

            // Date formatting for search
            const dateObj = new Date(img.created_at);
            const dateStr = dateObj.toLocaleDateString(); // e.g., "2024. 3. 10."
            const isoDate = dateObj.toISOString().split('T')[0]; // "2024-03-10"
            const compactDate = isoDate.replace(/-/g, ''); // "20240310"

            const isNonMember = !img.profiles?.email;
            const matchesNonMemberQuery = query === '비회원' || query === 'guest';

            return (
                promptContent.includes(query) ||
                styleContent.includes(query) ||
                emailContent.includes(query) ||
                dateStr.includes(query) ||
                isoDate.includes(query) ||
                compactDate.includes(query) ||
                (isNonMember && matchesNonMemberQuery)
            );
        });
    }, [images, searchQuery]);

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">생성된 이미지</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <p className="admin-page-desc" style={{ marginBottom: 0 }}>플랫폼에서 사용자들이 생성한 이미지를 확인합니다.</p>
                        {searchQuery && (
                            <span style={{
                                background: 'rgba(163, 183, 52, 0.1)',
                                color: '#a3b734',
                                padding: '2px 10px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: 600
                            }}>
                                검색 결과: {filteredImages.length}건
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="action-btn" onClick={fetchImages}>새로고침</button>
                </div>
            </div>

            <div className="admin-card admin-table-container" style={{ padding: '0' }}>
                {loading ? (
                    <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>이미지를 불러오는 중...</div>
                ) : filteredImages.length === 0 ? (
                    <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>
                        {searchQuery ? `'${searchQuery}'에 대한 검색 결과가 없습니다.` : '아직 생성된 이미지가 없습니다.'}
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '20px',
                        padding: '24px'
                    }}>
                        {filteredImages.map((img) => (
                            <div key={img.id} style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div
                                    style={{
                                        width: '100%',
                                        aspectRatio: '4/3',
                                        backgroundColor: '#141416',
                                        position: 'relative',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setZoomedImage(img.url)}
                                >
                                    <img
                                        src={img.url}
                                        alt="Generated"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="%231e293b"><rect width="100%" height="100%"/><text x="50%" y="50%" fill="%23475569" font-family="sans-serif" font-size="20" dominant-baseline="middle" text-anchor="middle">이미지를 찾을 수 없음</text></svg>';
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        background: 'rgba(0,0,0,0.6)',
                                        backdropFilter: 'blur(4px)',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {img.style || '원본'}
                                    </div>
                                </div>
                                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{new Date(img.created_at).toLocaleDateString()}</span>
                                        {img.is_favorite && <span style={{ color: '#ef4444' }}>❤️ 좋아요</span>}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 500, wordBreak: 'break-all' }}>
                                        {img.profiles?.email || '알 수 없는 사용자'}
                                    </div>
                                    <div style={{
                                        fontSize: '0.8rem',
                                        color: '#64748b',
                                        background: 'rgba(0,0,0,0.2)',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        flexGrow: 1
                                    }}>
                                        "{img.prompt || '추가 프롬프트 없음'}"
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Zoom Modal */}
            {zoomedImage && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    onClick={() => setZoomedImage(null)}
                >
                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
                        <img
                            src={zoomedImage}
                            alt="Zoomed"
                            style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" fill="%231e293b"><rect width="100%" height="100%"/><text x="50%" y="50%" fill="%23475569" font-family="sans-serif" font-size="30" dominant-baseline="middle" text-anchor="middle">이미지를 찾을 수 없음</text></svg>';
                            }}
                        />
                        <button
                            onClick={() => setZoomedImage(null)}
                            style={{
                                position: 'absolute', top: -40, right: 0,
                                background: 'transparent', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeneratedImages;
