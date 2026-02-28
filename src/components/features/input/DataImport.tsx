"use client";

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Plus, Trash2, Sparkles } from 'lucide-react';
import { Personnel } from '@/types';

interface DataImportProps {
    onComplete: (data: Personnel[]) => void;
    onDataUpdate?: (data: Personnel[]) => void;
    onBack: () => void;
}

type ColumnMapping = {
    name: string;
    gender: string;
    studentId: string;
};

type ExtraMapping = {
    id: string;
    label: string;
    header: string;
};

export const DataImport: React.FC<DataImportProps> = ({ onComplete, onDataUpdate, onBack }) => {
    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<ColumnMapping>({
        name: '',
        gender: '',
        studentId: ''
    });
    const [extraMappings, setExtraMappings] = useState<ExtraMapping[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (uploadedFile) processFile(uploadedFile);
    };

    const processFile = (uploadedFile: File) => {
        setFile(uploadedFile);
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });

            if (jsonData.length > 0) {
                const headerRow = jsonData[0] as string[];
                const dataRows = jsonData.slice(1);
                setHeaders(headerRow);
                setData(dataRows);

                // Smart Auto-Mapping
                const newMapping = { ...mapping };
                headerRow.forEach(h => {
                    const lower = h.toLowerCase().replace(/\s/g, '');
                    if (lower.includes('name') || lower.includes('이름') || lower.includes('성함')) newMapping.name = h;
                    else if (lower.includes('gender') || lower.includes('성별')) newMapping.gender = h;
                    else if (lower.includes('학번') || lower.includes('studentid') || lower.includes('id') || lower.includes('번호')) newMapping.studentId = h;
                });
                setMapping(newMapping);
            }
        };
        reader.readAsBinaryString(uploadedFile);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) processFile(droppedFile);
    };

    const addExtraMapping = () => {
        setExtraMappings([
            ...extraMappings,
            { id: Date.now().toString(), label: '', header: '' }
        ]);
    };

    const removeExtraMapping = (id: string) => {
        setExtraMappings(extraMappings.filter(m => m.id !== id));
    };

    const updateExtraMapping = (id: string, field: keyof ExtraMapping, value: string) => {
        setExtraMappings(extraMappings.map(m =>
            m.id === id ? { ...m, [field]: value } : m
        ));
    };

    // Lift state up whenever data changes
    const visibleHeaders = React.useMemo(() => {
        const mapped = [mapping.name, mapping.gender, mapping.studentId].filter(Boolean);
        const extras = extraMappings.map(m => m.header).filter(Boolean);
        return headers.filter(h => mapped.includes(h) || extras.includes(h));
    }, [headers, mapping, extraMappings]);

    const processedPersonnel = React.useMemo(() => {
        if (data.length === 0) return [];

        const nameIdx = headers.indexOf(mapping.name);
        const genderIdx = headers.indexOf(mapping.gender);
        const studentIdIdx = headers.indexOf(mapping.studentId);

        return data.map((row, idx) => {
            const nameVal = row[nameIdx] || '';
            const isMale = genderIdx >= 0 && (String(row[genderIdx]).trim().toUpperCase().startsWith('M') || String(row[genderIdx]).trim() === '남');
            const studentId = studentIdIdx >= 0 ? String(row[studentIdIdx] || '') : '';

            // AI에게 전달할 추가 태그 추출
            const tags: string[] = [];
            if (studentId) tags.push(`학번: ${studentId}`);

            extraMappings.forEach(m => {
                const hIdx = headers.indexOf(m.header);
                if (hIdx >= 0 && row[hIdx]) {
                    tags.push(`${m.label || m.header}: ${row[hIdx]}`);
                }
            });

            const mappedHeaders = [mapping.name, mapping.gender, mapping.studentId, ...extraMappings.map(m => m.header)];

            return {
                id: studentId || `p-${idx}`, // 학번이 있으면 ID로 사용, 없으면 인덱스
                name: String(nameVal).trim(),
                gender: (genderIdx >= 0 ? (isMale ? 'M' : 'F') : undefined) as 'M' | 'F' | undefined,
                history: [], // History는 이제 tags나 attributes에서 관리
                tags,
                attributes: visibleHeaders.reduce((acc, header) => {
                    const hIdx = headers.indexOf(header);
                    // 기본 필수 필드(이름, 학번, 성별)는 속성 목록에서 중복 표시되지 않도록 제외 (선택 사항)
                    if (hIdx >= 0 && ![mapping.name, mapping.studentId, mapping.gender].includes(header)) {
                        acc[header] = row[hIdx];
                    }
                    return acc;
                }, {} as Record<string, any>),
                fullAttributes: headers.reduce((acc, header, hIdx) => {
                    if (header) {
                        acc[header] = row[hIdx];
                    }
                    return acc;
                }, {} as Record<string, any>)
            };
        }).filter(p => !!p.name);
    }, [data, headers, mapping, extraMappings, visibleHeaders]);


    React.useEffect(() => {
        if (onDataUpdate) {
            onDataUpdate(processedPersonnel);
        }
    }, [processedPersonnel, onDataUpdate]);

    const finalizeImport = () => {
        onComplete(processedPersonnel);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Upload Zone */}
            {!file ? (
                <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                        border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: '12px',
                        padding: '40px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        cursor: 'pointer',
                        backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        transition: 'all 0.2s'
                    }}
                >
                    <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: '50%' }}>
                        <Upload size={32} color="var(--primary)" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>파일을 클릭하거나 여기로 드래그하세요</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>지원 형식: .xlsx, .csv</p>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".xlsx,.xls,.csv"
                        style={{ display: 'none' }}
                    />
                </label>
            ) : (
                <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileSpreadsheet color="var(--success)" />
                        <div>
                            <p style={{ fontWeight: 600 }}>{file.name}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{data.length} 건의 데이터 발견</p>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={() => { setFile(null); setData([]); }} style={{ color: 'var(--error)' }}>
                        제거
                    </Button>
                </Card>
            )}

            {/* Mapping Section */}
            {data.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                    <div style={{
                        padding: '16px',
                        background: 'rgba(99, 102, 241, 0.05)',
                        border: '1px solid rgba(99, 102, 241, 0.1)',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        fontSize: '0.9rem',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <Sparkles size={18} />
                        <div>
                            <strong>토큰 절약 모드 활성화:</strong> 배정 시 AI에게는 여기서 <strong>연결(매핑)한 컬럼</strong>만 전달됩니다.
                            그 외 모든 컬럼은 데이터 무결성을 위해 최종 결과에만 포함됩니다.
                        </div>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>컬럼 매핑 (AI 배정 고려 항목)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { label: '이름', key: 'name', req: true },
                            { label: '학번', key: 'studentId', req: false },
                            { label: '성별', key: 'gender', req: true }
                        ].map((field) => (
                            <div key={field.key}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                    {field.label} {field.req && <span style={{ color: 'var(--error)' }}>*</span>}
                                </label>
                                <select
                                    className="input-field"
                                    value={mapping[field.key as keyof ColumnMapping]}
                                    onChange={(e) => setMapping({ ...mapping, [field.key as keyof ColumnMapping]: e.target.value })}
                                >
                                    <option value="">컬럼 선택...</option>
                                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>추가 항목 (AI 배정 시 참고)</h4>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button variant="outline" onClick={addExtraMapping} style={{ fontSize: '0.8rem', height: '32px' }}>
                                <Plus size={14} /> 직접 추가
                            </Button>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        {extraMappings.map((m) => (
                            <div key={m.id} style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="새 컬럼 이름"
                                        value={m.label}
                                        onChange={(e) => updateExtraMapping(m.id, 'label', e.target.value)}
                                        style={{
                                            fontSize: '0.85rem',
                                            padding: '4px 8px',
                                            border: '1px solid var(--border)',
                                            borderRadius: '4px',
                                            width: '60%'
                                        }}
                                    />
                                    <button
                                        onClick={() => removeExtraMapping(m.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <select
                                    className="input-field"
                                    value={m.header}
                                    onChange={(e) => updateExtraMapping(m.id, 'header', e.target.value)}
                                >
                                    <option value="">컬럼 선택...</option>
                                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                        ))}

                        {/* Add Column Button */}
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <Button
                                variant="ghost"
                                onClick={addExtraMapping}
                                style={{
                                    height: '42px',
                                    width: '100%',
                                    border: '1px dashed var(--border)',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                <Plus size={16} style={{ marginRight: '8px' }} /> 컬럼 추가
                            </Button>
                        </div>
                    </div>

                    {/* Data Preview */}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>가져온 데이터 미리보기 ({Math.min(5, data.length)} / {data.length})</h3>
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                                <tr>
                                    {visibleHeaders.map((h, i) => (
                                        <th key={i} style={{ padding: '12px', textAlign: 'left', backgroundColor: 'rgba(99, 102, 241, 0.05)' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.slice(0, 5).map((row, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                        {visibleHeaders.map((h, hIdx) => {
                                            const originalIdx = headers.indexOf(h);
                                            return (
                                                <td key={hIdx} style={{ padding: '12px' }}>
                                                    {row[originalIdx] !== undefined ? String(row[originalIdx]) : '-'}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <Button variant="ghost" onClick={onBack}>이전</Button>
                <Button onClick={finalizeImport} disabled={!mapping.name || !mapping.gender}>
                    데이터 처리 및 다음 단계
                </Button>
            </div>
        </div>
    );
};
