import { getApiDocs } from "@/lib/swagger";
import ReactSwagger from "./react-swagger";

export default async function IndexPage() {
  const spec = await getApiDocs();
  return (
    <section className="bg-white h-screen overflow-y-auto w-full">
      <div className="container mx-auto p-4">
        <ReactSwagger spec={spec} />
      </div>
    </section>
  );
}
