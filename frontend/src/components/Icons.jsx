const svgProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
};

export function IconDineIn() {
    return (
        <svg {...svgProps}>
            <path d="M4 3v6a3 3 0 0 0 6 0V3" />
            <path d="M7 3v18" />
            <path d="M20 3v8a4 4 0 0 1-4 4h0" />
            <path d="M16 3v18" />
        </svg>
    );
}

export function IconTakeOut() {
    return (
        <svg {...svgProps}>
            <path d="M6.5 8h11l-.8 12H7.3L6.5 8z" />
            <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
        </svg>
    );
}

export function IconDashboard() {
    return (
        <svg {...svgProps}>
            <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </svg>
    );
}

export function IconMenu() {
    return (
        <svg {...svgProps}>
            <path d="M8 6h12" />
            <path d="M8 12h12" />
            <path d="M8 18h12" />
            <path d="M4 6h.01" />
            <path d="M4 12h.01" />
            <path d="M4 18h.01" />
        </svg>
    );
}

export function IconInventory() {
    return (
        <svg {...svgProps}>
            <path d="M3.5 8.5 12 4l8.5 4.5L12 13 3.5 8.5z" />
            <path d="M3.5 8.5V16L12 20.5 20.5 16V8.5" />
            <path d="M12 13v7.5" />
        </svg>
    );
}

export function IconCashier() {
    return (
        <svg {...svgProps}>
            <rect x="3.5" y="5" width="17" height="14" rx="2" />
            <path d="M3.5 10h17" />
            <path d="M7 15h4" />
        </svg>
    );
}

export function IconKitchen() {
    return (
        <svg {...svgProps}>
            <path d="M6 10h12" />
            <path d="M7 10a5 5 0 0 0 10 0" />
            <path d="M12 15v4" />
            <path d="M9 19h6" />
        </svg>
    );
}

export function IconLogout() {
    return (
        <svg {...svgProps}>
            <path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" />
            <path d="M14 16l4-4-4-4" />
            <path d="M18 12H9" />
        </svg>
    );
}
