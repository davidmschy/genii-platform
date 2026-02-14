import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const url = request.nextUrl
    const hostname = request.headers.get('host') || 'geniinow.com'

    // Define domains
    const landingDomain = 'geniinow.com'
    const missionControlDomain = 'enjoy.geniinow.com'

    // Skip static files and api routes
    if (
        url.pathname.includes('.') ||
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/api')
    ) {
        return NextResponse.next()
    }

    // Handle Mission Control Subdomain
    if (hostname === missionControlDomain) {
        // If user is at root of enjoy.geniinow.com, they stay at / (which is mission control)
        // We could rewrite internal paths if we had a dedicated /dashboard folder
        return NextResponse.next()
    }

    // Handle Landing Page (Root Domain)
    if (hostname === landingDomain) {
        // If we wanted a separate landing page under /landing, we'd rewrite here
        // For now, mission control IS the home page, but the user asked for 
        // enjoy.geniinow.com to be the mission control.
        // Let's assume the current root is Mission Control and we might want to 
        // differentiate later.
    }

    return NextResponse.next()
}
