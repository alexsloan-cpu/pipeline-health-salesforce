@IsTest
private class CockpitUsageControllerTest {

    private static Cockpit_Usage_Day__c rowFor(String cockpit) {
        return [
            SELECT Sessions__c, Views_My_Day__c, Views_Pipeline_Forecast__c, Actions_Completed__c,
                   Active_Minutes__c, Cockpit__c, User__c, Usage_Date__c, First_Seen__c, Last_Seen__c
            FROM Cockpit_Usage_Day__c
            WHERE Cockpit__c = :cockpit
        ];
    }

    @IsTest
    static void firstCallCreatesTheDayRow() {
        Test.startTest();
        Boolean ok = CockpitUsageController.track(
            '{"cockpit":"AE","counts":{"session":1,"tab:day":2,"action:done":1},"activeSeconds":90}');
        Test.stopTest();
        System.assert(ok, 'Counts should save');
        Cockpit_Usage_Day__c r = rowFor('AE');
        System.assertEquals(1, r.Sessions__c.intValue());
        System.assertEquals(2, r.Views_My_Day__c.intValue());
        System.assertEquals(1, r.Actions_Completed__c.intValue());
        System.assert(r.Active_Minutes__c == 1.5, 'Ninety seconds is 1.5 minutes');
        System.assertEquals(UserInfo.getUserId(), r.User__c);
        System.assertEquals(Date.today(), r.Usage_Date__c);
        System.assertNotEquals(null, r.First_Seen__c);
    }

    @IsTest
    static void laterCallsAddToTheSameRow() {
        CockpitUsageController.track('{"cockpit":"AE","counts":{"session":1,"tab:pipe":1}}');
        CockpitUsageController.track('{"cockpit":"AE","counts":{"tab:pipe":3},"activeSeconds":60}');
        System.assertEquals(1, [SELECT COUNT() FROM Cockpit_Usage_Day__c]);
        Cockpit_Usage_Day__c r = rowFor('AE');
        System.assertEquals(4, r.Views_Pipeline_Forecast__c.intValue());
        System.assert(r.Active_Minutes__c == 1, 'Sixty seconds is one minute');
    }

    @IsTest
    static void bdrAndAeKeepSeparateRows() {
        CockpitUsageController.track('{"cockpit":"AE","counts":{"session":1}}');
        CockpitUsageController.track('{"cockpit":"BDR","counts":{"session":1,"tab:protect":1}}');
        System.assertEquals(2, [SELECT COUNT() FROM Cockpit_Usage_Day__c]);
        System.assertEquals(1, rowFor('BDR').Views_Pipeline_Forecast__c.intValue());
    }

    @IsTest
    static void unknownKeysAndBadNumbersAreIgnored() {
        Boolean ok = CockpitUsageController.track('{"cockpit":"AE","counts":{"hack":5,"tab:day":-3}}');
        System.assert(!ok, 'Nothing valid to save');
        System.assertEquals(0, [SELECT COUNT() FROM Cockpit_Usage_Day__c]);
    }

    @IsTest
    static void runawayCountsAreCapped() {
        CockpitUsageController.track('{"cockpit":"AE","counts":{"tab:day":100000},"activeSeconds":999999}');
        Cockpit_Usage_Day__c r = rowFor('AE');
        System.assertEquals(CockpitUsageController.MAX_PER_FLUSH, r.Views_My_Day__c.intValue());
        System.assert(r.Active_Minutes__c == CockpitUsageController.MAX_ACTIVE_MINUTES_PER_FLUSH, 'Active minutes are capped');
    }

    @IsTest
    static void badJsonNeverThrows() {
        System.assert(!CockpitUsageController.track('not json'), 'Bad input returns false');
        System.assert(!CockpitUsageController.track(null), 'Null input returns false');
    }

    @IsTest
    static void sellerCanTrackWithOnlyTheLoggerPermissionSet() {
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        User u = new User(
            Alias = 'cku', Email = 'cockpit.usage.test@example.com', EmailEncodingKey = 'UTF-8',
            LastName = 'Usage', LanguageLocaleKey = 'en_US', LocaleSidKey = 'en_US',
            ProfileId = p.Id, TimeZoneSidKey = 'America/Denver',
            Username = 'cockpit.usage.test.' + System.now().getTime() + '@example.com');
        System.runAs(new User(Id = UserInfo.getUserId())) {
            insert u;
            PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'Cockpit_Usage_Logger' LIMIT 1];
            insert new PermissionSetAssignment(AssigneeId = u.Id, PermissionSetId = ps.Id);
        }
        Boolean ok;
        System.runAs(u) {
            ok = CockpitUsageController.track('{"cockpit":"AE","counts":{"session":1}}');
        }
        System.assert(ok, 'Seller write should succeed through the controller');
        Cockpit_Usage_Day__c r = [SELECT User__c FROM Cockpit_Usage_Day__c LIMIT 1];
        System.assertEquals(u.Id, r.User__c);
    }
}
