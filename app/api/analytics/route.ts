import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { AnalyticsService } from "@/services/analytics";

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { methodSelected, sentParams } = await request.json();

    if (methodSelected === 'getSellerStats') {
        const sellerStats = await AnalyticsService.getSellerStats(user.id, sentParams.period);
        return NextResponse.json(sellerStats);
    }

    if (methodSelected === 'getListingStats') {
        const listingStats = await AnalyticsService.getListingStats(sentParams.listingId);
        return NextResponse.json(listingStats);
    }

    if (methodSelected === 'getBuyerStats') {
        const buyerStats = await AnalyticsService.getBuyerStats(sentParams.buyerId);
        return NextResponse.json(buyerStats);
    }

    if (methodSelected === 'getListingsPerformance') {
        const listingsPerformance = await AnalyticsService.getListingsPerformance(sentParams.sellerId);
        return NextResponse.json(listingsPerformance);
    }

    if (methodSelected === 'exportReservationsData') {
        const reservationsData = await AnalyticsService.exportReservationsData(sentParams.sellerId, sentParams.exportFormat, sentParams.period);
        return NextResponse.json(reservationsData);
    }


    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
}