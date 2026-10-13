import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
const action=await readFile(new URL("../lib/auth/settings-actions.ts",import.meta.url),"utf8"),page=await readFile(new URL("../app/settings/page.tsx",import.meta.url),"utf8"),form=await readFile(new URL("../components/auth/username-settings-form.tsx",import.meta.url),"utf8"),dashboard=await readFile(new URL("../app/dashboard/page.tsx",import.meta.url),"utf8");
test("settings requires an active profile and is linked from the dashboard",()=>{assert.match(page,/requireActiveProfile/);assert.match(dashboard,/href="\/settings"/);assert.match(page,/UsernameSettingsForm/)})
test("users can change only their own validated unique username",()=>{assert.match(action,/requireActiveProfile/);assert.match(action,/isValidUsername/);assert.match(action,/eq\("username",username\)/);assert.doesNotMatch(action,/userId:string/);assert.match(form,/updateUsernameAction/)})
test("username changes update auth email and profile with rollback",()=>{assert.match(action,/auth\.admin\.updateUserById/);assert.match(action,/usernameToAuthEmail/);assert.match(action,/username_display:username/);assert.match(action,/usernameToAuthEmail\(profile\.username\)/)})
