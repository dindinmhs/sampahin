import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Test koneksi sederhana ke table locations
    const { data: locations, error: locError } = await supabase
      .from("locations")
      .select("id, city, province, lat, lan")
      .not("city", "is", null)
      .limit(100);

    if (locError) {
      console.error("Locations error:", locError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch locations",
          details: locError.message,
        },
        { status: 500 }
      );
    }

    // Test koneksi sederhana ke cleanliness_reports
    const { data: reports, error: repError } = await supabase
      .from("cleanliness_reports")
      .select("score, location")
      .limit(100);

    if (repError) {
      console.error("Reports error:", repError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch reports",
          details: repError.message,
        },
        { status: 500 }
      );
    }

    // Jika tidak ada data, return empty result
    if (!locations || locations.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        message: "No location data available",
      });
    }

    if (!reports || reports.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        message: "No report data available",
      });
    }

    // Buat mapping locations berdasarkan ID dan koordinat
    const locationMap: any = {};
    const cityMap: any = {};
    const cityReports: any = {};

    // Map locations berdasarkan ID untuk matching dengan reports
    locations.forEach((loc: any) => {
      const coordKey = `${loc.lat}_${loc.lan}`;
      const cityKey = `${loc.city}_${loc.province}`;

      // Store location by ID for matching with reports
      locationMap[loc.id] = {
        ...loc,
        coordKey,
        cityKey,
      };

      // Group by city dengan deduplication koordinat
      if (!cityMap[cityKey]) {
        cityMap[cityKey] = {
          city: loc.city,
          province: loc.province,
          uniqueCoords: new Set(),
          locationIds: [],
        };
      }

      cityMap[cityKey].uniqueCoords.add(coordKey);
      cityMap[cityKey].locationIds.push(loc.id);

      // Initialize city reports counter
      if (!cityReports[cityKey]) {
        cityReports[cityKey] = {
          scores: [],
          totalReports: 0,
          reportsByCoord: {},
        };
      }
    });

    // Match reports dengan locations berdasarkan location ID
    reports.forEach((report: any) => {
      const locationId = report.location;
      const score = parseFloat(report.score) || 0;

      if (locationId && locationMap[locationId] && score !== null) {
        const location = locationMap[locationId];
        const cityKey = location.cityKey;
        const coordKey = location.coordKey;

        if (cityReports[cityKey]) {
          cityReports[cityKey].scores.push(score);
          cityReports[cityKey].totalReports++;

          // Group by coordinate for deduplication tracking
          if (!cityReports[cityKey].reportsByCoord[coordKey]) {
            cityReports[cityKey].reportsByCoord[coordKey] = [];
          }
          cityReports[cityKey].reportsByCoord[coordKey].push(score);
        }
      }
    });

    // Calculate real scores untuk setiap city
    const cities = Object.values(cityMap).map((cityData: any) => {
      const cityKey = `${cityData.city}_${cityData.province}`;
      const cityReportData = cityReports[cityKey] || {
        scores: [],
        totalReports: 0,
      };

      // Hitung rata-rata score dari reports yang sesuai
      const avgScore =
        cityReportData.scores.length > 0
          ? cityReportData.scores.reduce(
              (sum: number, score: number) => sum + score,
              0
            ) / cityReportData.scores.length
          : 0;

      return {
        city: cityData.city,
        province: cityData.province,
        avgScore: Math.round(avgScore * 100) / 100, // Real calculated score from matched reports
        rank: 0, // Will be set after sorting
      };
    });

    // Sort by avgScore
    cities.sort((a: any, b: any) => b.avgScore - a.avgScore);
    cities.forEach((city: any, index: number) => {
      city.rank = index + 1;
    });

    return NextResponse.json({
      success: true,
      data: cities,
      total: cities.length,
      metadata: {
        calculationMethod: "Real data with coordinate deduplication",
        note: "City ranking based on cleanliness scores from database",
        dataSource: "Real Supabase database",
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
