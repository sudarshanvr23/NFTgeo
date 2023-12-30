import { Engine } from "@thirdweb-dev/engine";
import { NextApiRequest, NextApiResponse } from "next";
import { NFT_CONTRACT_ADDRESS } from "../../constants/constants";

export type Coordinates = {
    lat: number;
    lng: number;
};

function toRad(x: number): number {
    return x * Math.PI / 180;
}

export function haversineDistance(coords1: Coordinates, coords2: Coordinates, isMiles: boolean = false): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c;

    if (isMiles) d /= 1.60934; // Convert km to miles

    return d;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed, please use POST" });
    }

    const {
        TW_ENGINE_URL,
        TW_ACCESS_TOKEN,
        TW_BACKEND_WALLET,
    } = process.env;
    
    try {
        if(!TW_ENGINE_URL || !TW_ACCESS_TOKEN || !TW_BACKEND_WALLET) {
            throw new Error("Missing environment variables");
        }

        const { 
            tokenId, 
            address, 
            userPosition, 
            nftPosition 
        } = req.body;

        const radius = 0.1;

        const isWithinRange = haversineDistance(userPosition, nftPosition, true) <= radius;

        if (!isWithinRange) {
            console.log("User is not within range of the NFT");
            return res.status(500).json({ error: "You are not within range of the NFT" });
        } else {
            const engine = new Engine({
                url: TW_ENGINE_URL,
                accessToken: TW_ACCESS_TOKEN,
            });
    
            const response = await engine.erc1155.claimTo(
                "mumbai",
                NFT_CONTRACT_ADDRESS,
                TW_BACKEND_WALLET,
                {
                    receiver: address,
                    tokenId: tokenId,
                    quantity: "1",
                }
            );

            res.status(200).json(response);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Unexpected error." });
    }
};

export default handler;