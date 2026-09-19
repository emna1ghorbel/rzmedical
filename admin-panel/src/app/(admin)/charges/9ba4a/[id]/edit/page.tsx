import SpecificChargeForm from "@/components/achats/SpecificChargeForm";

export default function Edit9ba4aPage({ params }: { params: { id: string } }) {
  return <SpecificChargeForm categorie="NEUF_BA4A" id={Number(params.id)} />;
}
