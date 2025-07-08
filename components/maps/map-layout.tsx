"use client"
import dynamic from "next/dynamic";

const Maps = dynamic(() => import("@/components/maps/map"), {
  ssr: false,
});

export const MapsLayout = () => {
  return (
    <Maps/>
  )
}
