import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

const statement = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
  ...ownerAc.statements,
});

export const member = ac.newRole({
  ...memberAc.statements,
});

export const teamAdmin = ac.newRole({
  organization: [],
  member: ["update", "delete"],
  invitation: ["create", "cancel"],
  team: ["update"],
  ac: ["read"],
});

export const organizationRoles = {
  owner,
  member,
  "team-admin": teamAdmin,
};
