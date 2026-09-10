import type { IconType } from "react-icons";
import { FiAward, FiCreditCard, FiTag } from "react-icons/fi";
import {
  DEFAULT_SERVICE_KIND,
  SERVICE_KIND_ACCENTS,
  ServiceKind,
} from "@/config/serviceKinds";

export const SERVICE_KIND_ICONS: Record<ServiceKind, IconType> = {
  visa: FiCreditCard,
  license: FiAward,
  other: FiTag,
};

export function getServiceKindIcon(kind: ServiceKind): IconType {
  return SERVICE_KIND_ICONS[kind] || SERVICE_KIND_ICONS[DEFAULT_SERVICE_KIND];
}

export function getServiceKindAccent(kind: ServiceKind): string {
  return SERVICE_KIND_ACCENTS[kind] || SERVICE_KIND_ACCENTS[DEFAULT_SERVICE_KIND];
}
