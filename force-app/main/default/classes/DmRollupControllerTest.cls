@IsTest
private class DmRollupControllerTest {

    @IsTest
    static void mineReturnsStructure() {
        DmRollupController.Result r = DmRollupController.getRollup('mine');
        System.assertNotEquals(null, r);
        System.assertNotEquals(null, r.rows);
        System.assertEquals('mine', r.scope);
        System.assertEquals(UserInfo.getName(), r.userName);
    }

    @IsTest
    static void teamFallsBackToMineWhenNoReports() {
        Profile p = [SELECT Id FROM Profile WHERE Name = 'System Administrator' LIMIT 1];
        UserRole leaf = new UserRole(Name = 'PH Test Leaf');
        insert leaf;
        String sfx = String.valueOf(Crypto.getRandomInteger()).replace('-', 'x');
        User rep = makeUser(p.Id, leaf.Id, 'phleaf' + sfx);
        insert rep;
        System.runAs(rep) {
            DmRollupController.Result r = DmRollupController.getRollup('team');
            System.assertEquals(false, r.hasTeam);
            System.assertEquals('mine', r.scope);
        }
    }

    @IsTest
    static void managerSeesTeam() {
        Profile p = [SELECT Id FROM Profile WHERE Name = 'System Administrator' LIMIT 1];
        UserRole parent = new UserRole(Name = 'PH Test Parent');
        insert parent;
        UserRole child = new UserRole(Name = 'PH Test Child', ParentRoleId = parent.Id);
        insert child;
        String sfx = String.valueOf(Crypto.getRandomInteger()).replace('-', 'x');
        User mgr = makeUser(p.Id, parent.Id, 'phmgr' + sfx);
        User rep = makeUser(p.Id, child.Id, 'phrep' + sfx);
        insert new List<User>{ mgr, rep };
        System.runAs(mgr) {
            DmRollupController.Result r = DmRollupController.getRollup('team');
            System.assertEquals(true, r.hasTeam);
            System.assertEquals(1, r.teamSize);
            System.assertEquals('team', r.scope);
            System.assertNotEquals(null, r.rows);
        }
        System.runAs(rep) {
            System.assertEquals(false, DmRollupController.getRollup('team').hasTeam);
        }
    }

    @IsTest
    static void rowMappingHandlesEmptyRecord() {
        DmRollupController.Row r = DmRollupController.toRow(new Deal_Milestones__c());
        System.assertEquals(null, r.oppName);
        System.assertEquals(null, r.done);
    }

    private static User makeUser(Id profileId, Id roleId, String alias) {
        return new User(
            Alias = alias.left(8), Email = alias + '@example.com', Username = alias + '@example.com.ph',
            LastName = alias, ProfileId = profileId, UserRoleId = roleId, TimeZoneSidKey = 'America/Denver',
            LocaleSidKey = 'en_US', EmailEncodingKey = 'UTF-8', LanguageLocaleKey = 'en_US', IsActive = true
        );
    }
}