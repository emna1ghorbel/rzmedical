import SpecificChargeForm from "@/components/achats/SpecificChargeForm";

export default function EditCnssPage({ params }: { params: { id: string } }) {
  return <SpecificChargeForm categorie="CNSS" id={Number(params.id)} />;
}
