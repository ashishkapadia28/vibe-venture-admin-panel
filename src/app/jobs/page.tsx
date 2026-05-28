import JobsManager from "@/components/JobsManager";

export default function JobsPage() {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <JobsManager />
      </div>
    </div>
  );
}
