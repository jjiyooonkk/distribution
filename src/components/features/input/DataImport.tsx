"use client";

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Personnel } from '@/types';

interface DataImportProps {
    onComplete: (data: Personnel[]) => void;
    onBack: () => void;
}

type ColumnMapping = {
    name: string;
    gender: string;
    history: string;
    tags: string;
};

type ExtraMapping = {
    id: string;
    label: string;
    header: string;
};

export const DataImport: React.FC<DataImportProps> = ({ onComplete, onBack }) => {
    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<ColumnMapping>({
        name: '',
        gender: '',
        history: '',
        tags: ''
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
                    const lower = h.toLowerCase();
                    if (lower.includes('name') || lower.includes('이름')) newMapping.name = h;
                    else if (lower.includes('gender') || lower.includes('성별')) newMapping.gender = h;
                    else if (lower.includes('history') || lower.includes('이력') || lower.includes('실습')) newMapping.history = h;
                    else if (lower.includes('tag') || lower.includes('특이') || lower.includes('비고')) newMapping.tags = h;
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

    const finalizeImport = () => {
        // Transform into system Personnel type
        const nameIdx = headers.indexOf(mapping.name);
        const genderIdx = headers.indexOf(mapping.gender);
        const historyIdx = headers.indexOf(mapping.history);
        const tagsIdx = headers.indexOf(mapping.tags);

        const processedData: Personnel[] = data.map((row, idx) => {
            const historyRaw = historyIdx >= 0 ? String(row[historyIdx] || '') : '';
            const tagsRaw = tagsIdx >= 0 ? String(row[tagsIdx] || '') : '';

            const genderVal = row[genderIdx];
            // Normalize gender value
            const isMale = String(genderVal).trim().toUpperCase().startsWith('M') || String(genderVal).trim() === '남';

            return {
                id: `p-${idx}`,
                name: row[nameIdx],
                gender: (isMale ? 'M' : 'F') as 'M' | 'F',
                // Parse "Anseong, Hoil" -> ['Anseong', 'Hoil']
                history: historyRaw.split(',').map(s => s.trim()).filter(Boolean),
                tags: tagsRaw.split(',').map(s => s.trim()).filter(Boolean),
                attributes: extraMappings.reduce((acc, m) => {
                    const idx = headers.indexOf(m.header);
                    if (idx >= 0 && m.label) {
                        acc[m.label] = row[idx];
                    }
                    return acc;
                }, {} as Record<string, any>)
            };
        }).filter(p => p.name); // Filter empty rows

        onComplete(processedData);
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
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>컬럼 매핑</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        {[
                            { label: '이름 (Name)', key: 'name', req: true },
                            { label: '성별 (Gender)', key: 'gender', req: true },
                            { label: '과거 이력 (History)', key: 'history', req: false },
                            { label: '비고/태그 (Note)', key: 'tags', req: false }
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

                        {/* Extra Mappings */}
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
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>미리보기 ({Math.min(5, data.length)} / {data.length})</h3>
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                                <tr>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>이름</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>성별</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>이력</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>태그</th>
                                    {extraMappings.map(m => (
                                        <th key={m.id} style={{ padding: '12px', textAlign: 'left' }}>{m.label || '(미지정)'}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.slice(0, 5).map((row, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px' }}>{row[headers.indexOf(mapping.name)] || '-'}</td>
                                        <td style={{ padding: '12px' }}>{row[headers.indexOf(mapping.gender)] || '-'}</td>
                                        <td style={{ padding: '12px' }}>{row[headers.indexOf(mapping.history)] || '-'}</td>
                                        <td style={{ padding: '12px' }}>{row[headers.indexOf(mapping.tags)] || '-'}</td>
                                        {extraMappings.map(m => (
                                            <td key={m.id} style={{ padding: '12px' }}>
                                                {row[headers.indexOf(m.header)] || '-'}
                                            </td>
                                        ))}
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
