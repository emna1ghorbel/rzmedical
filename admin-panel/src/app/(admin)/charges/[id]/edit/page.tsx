import SpecificChargeForm from "@/components/achats/SpecificChargeForm";

export default function EditChargePage({ params }: { params: { id: string } }) {
  return <SpecificChargeForm categorie="CHARGES" id={Number(params.id)} />;
}
