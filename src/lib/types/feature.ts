// src/lib/types/feature.ts
export type FeatureType = {
    href?: string;
    title: string;
    description: string;
    icon: string;
    color?: 'blue' | 'green' | 'orange' | 'purple' | 'gray';
    disabled?: boolean;
};

export type FeatureSection = {
    title: string;
    icon: string;
    features: FeatureType[];
}; 