export interface Decision {
    id: string;
    title: string;
    description?: string;
    status: 'DRAFT' | 'OPEN' | 'CLOSED';
    workspaceId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
}
