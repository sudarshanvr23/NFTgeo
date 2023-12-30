import { MediaRenderer, NFT, useAddress } from "@thirdweb-dev/react";
import { Coordinates } from "../utils/types/types";
import L from "leaflet";
import { useState } from "react";
import { Marker, Popup } from "react-leaflet";

type MarkerComponentProps = {
    nft: NFT;
    userPosition: Coordinates;
};

const nftIcon = new L.Icon({
    iconUrl: '/nft-marker.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});


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

const NFTMarker: React.FC<MarkerComponentProps> = ({ nft, userPosition }) => {
    const address = useAddress();
    const [isClaiming, setIsClaiming] = useState(false);
    //@ts-ignore
    const latitude = nft.metadata.attributes[0].value;
    //@ts-ignore
    const longitude = nft.metadata.attributes[1].value;
    const nftPosition: Coordinates = { lat: latitude, lng: longitude };
    const radius = 2;

    const isWithinRadius = () => {
        const distance = haversineDistance(userPosition, nftPosition);
        return distance <= radius;
    };

    const claimNFT = async () => {
        setIsClaiming(true);
        try {
            const response = await fetch('/api/mintNFT', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tokenId: nft.metadata.id,
                    address: address,
                    userPosition: userPosition,
                    nftPosition: nftPosition
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'An error occurred while claiming the NFT.');
            }

            alert("NFT claimed successfully!");
        } catch (error: any) {
            alert(error.message)
            console.error(error);
        } finally {
        setIsClaiming(false);
        }
    };

    return(
        <Marker position={nftPosition} icon={nftIcon}>
            <Popup>
                <div>
                    <MediaRenderer
                        src={nft.metadata.image}
                    />
                    <button
                        disabled={!isWithinRadius() || isClaiming}
                        onClick={claimNFT}
                    >{isClaiming ? "Claiming NFT..." : "Claim NFT"}</button>
                </div>
            </Popup>
        </Marker>
    )
};

export default NFTMarker;