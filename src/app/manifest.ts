import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "EasyRideCebu - Car Rentals & Tours",
        short_name: "EasyRideCebu",
        description:
            "Affordable car rentals and tour packages in Cebu. Airport transfers, city tours, Oslob whale sharks, Moalboal canyoneering.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
            {
                src: "/logo.jpg",
                sizes: "any",
                type: "image/jpeg",
            },
        ],
    };
}
