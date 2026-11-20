import Link from "next/link"

export default function NotFound() {
  return (
    <div className="shell py-16">
      <h1 className="page-title">That page is not here</h1>
      <p className="lede">The study may have been deleted.</p>
      <p className="mt-6">
        <Link href="/" className="btn">
          Back to studies
        </Link>
      </p>
    </div>
  )
}
