export type StorageSelection = {
    id: string;
    tegRoad?: string;
    tegRoadTombador?: string;
    tegRailwayMoega01?: string;
    tegRailwayMoega01Operation?: string;
    tegRailwayMoega02?: string;
    tegRailwayMoega02Operation?: string;
    teagRoad?: string;
    teagRailway?: string;
    teagRoadTombador05?: string;
    teagRailwayMoega03?: string;
    teagRailwayMoega03Operation?: string;
    teagRailwayMoega04?: string;
    teagRailwayMoega04Operation?: string;
    teagRailwayMoega05?: string;
    teagRailwayMoega05Operation?: string;
    updatedAt: Date;
    updatedBy: string;
    updatedByDepartment: string;
};

export type StorageLog = {
    id: string;
    changedBy: string;
    department: string;
    timestamp: Date;
    changes: Partial<Omit<StorageSelection, 'id' | 'updatedAt' | 'updatedBy' | 'updatedByDepartment'>>;
};