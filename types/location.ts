export interface LocationType {
    id: string;
    name: string;
    address: string;
    lat: number;
    lan: number;
    type: string;
    img_url: string;
    created_at?: string;
    updated_at?: string;
}

export interface LocationCleanerType {
    id: string;
    location_id: string;
    user_id: string;
    cleaner_name: string;
}