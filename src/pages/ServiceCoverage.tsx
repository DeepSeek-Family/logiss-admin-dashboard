import { CoverageTab } from "@/features/settings";

interface ServiceCoverageProps {
  role?: string | null;
}

const ServiceCoverage = ({ role }: ServiceCoverageProps) => {
  return (
    <div className="mx-auto w-full max-w-[1600px] pb-12">
      <div className="mb-5">
        <h1 className="type-page-title">Service & Tariffs</h1>
        <p className="mt-1 text-sm text-ink-3">
          Configure funding sources, trip fees, mobility surcharges, and service facilities.
        </p>
      </div>
      <CoverageTab role={role} />
    </div>
  );
};

export default ServiceCoverage;
