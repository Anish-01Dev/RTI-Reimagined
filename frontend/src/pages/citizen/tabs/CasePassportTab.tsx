import { useOutletContext } from "react-router-dom";
import { CitizenTrailPassport } from "@/components/case/CitizenTrailPassport";
import type { CaseRecord } from "@/domain/types";

export function CasePassportTab() {
  const record = useOutletContext<CaseRecord>();
  return <CitizenTrailPassport record={record} />;
}
