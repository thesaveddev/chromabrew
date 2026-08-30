const PRODUCT_HUNT_URL =
  "https://www.producthunt.com/products/chromabrew-free-design-system-tool/reviews/new?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-chromabrew&#0045;free&#0045;design&#0045;system&#0045;tool";

/**
 * Official Product Hunt "Leave a review" badge. Loads the embed image from
 * Product Hunt's CDN and links through to their review page.
 */
export function ProductHuntBadge() {
  return (
    <a
      href={PRODUCT_HUNT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block"
      aria-label="Leave a review for ChromaBrew on Product Hunt"
    >
      <img
        src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1304742&theme=light"
        alt="ChromaBrew — Free Design System Tool - Turn one brand color into a complete design system. | Product Hunt"
        width={250}
        height={54}
      />
    </a>
  );
}
