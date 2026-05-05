export interface ExportButtonModel {
    id: string;
    label: string;
    compactLabel: string;
    description: string;
    format: 'json' | 'markdown' | 'copy' | 'download' | 'share';
}

export function createExportButtonModel(model: ExportButtonModel): ExportButtonModel {
    return model;
}
