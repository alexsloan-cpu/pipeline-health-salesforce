public with sharing class DmOppActivityController {
    private static final Integer ROW_CAP = 2000;
    private static final Integer TIMELINE_MAX = 40;
    private static final Integer PEOPLE_MAX = 25;
    private static final Integer WEEKS = 8;

    public class Week {
        @AuraEnabled public String label;
        @AuraEnabled public Integer meetings = 0;
        @AuraEnabled public Integer calls = 0;
        @AuraEnabled public Integer emails = 0;
        @AuraEnabled public Integer other = 0;
    }

    public class Item implements Comparable {
        @AuraEnabled public String id;
        @AuraEnabled public String kind;
        @AuraEnabled public String day;
        @AuraEnabled public String subject;
        @AuraEnabled public String who;
        @AuraEnabled public String owner;
        public Integer compareTo(Object o) {
            Item other = (Item) o;
            if (day == other.day) { return 0; }
            return day > other.day ? -1 : 1;
        }
    }

    public class Person {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public String title;
        @AuraEnabled public String level;
        @AuraEnabled public String persona;
        @AuraEnabled public List<String> tags = new List<String>();
        @AuraEnabled public Integer touches = 0;
        @AuraEnabled public String lastTouch;
        @AuraEnabled public Boolean identified = false;
    }

    public class Field {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
    }

    public class Result {
        @AuraEnabled public Boolean hasOpp = false;
        @AuraEnabled public Boolean capped = false;
        @AuraEnabled public Integer last8Weeks = 0;
        @AuraEnabled public Integer contactsTouched = 0;
        @AuraEnabled public Integer contactsTotal = 0;
        @AuraEnabled public String lastMeeting;
        @AuraEnabled public String lastMomentum;
        @AuraEnabled public String lastEmailIn;
        @AuraEnabled public String lastEmailOut;
        @AuraEnabled public List<Week> weeks = new List<Week>();
        @AuraEnabled public List<Item> timeline = new List<Item>();
        @AuraEnabled public List<Person> people = new List<Person>();
        @AuraEnabled public List<Field> roleFields = new List<Field>();
    }

    @AuraEnabled(cacheable=true)
    public static Result getActivity(Id recordId) {
        return load(recordId, false);
    }

    // Same view across the whole account, for post-sales contact bands.
    @AuraEnabled(cacheable=true)
    public static Result getAccountActivity(Id recordId) {
        return load(recordId, true);
    }

    private static Result load(Id recordId, Boolean wholeAccount) {
        Result res = new Result();
        if (recordId == null) { return res; }
        List<Deal_Milestones__c> dms = [SELECT Opportunity__c, Account__c FROM Deal_Milestones__c WHERE Id = :recordId WITH USER_MODE LIMIT 1];
        if (dms.isEmpty() || dms[0].Opportunity__c == null) { return res; }
        Id oppId = dms[0].Opportunity__c;
        res.hasOpp = true;

        Opportunity opp = [
            SELECT Id, ContactId, DecisionMaker__c, Champion__c, Economic_Buyer__c, Decision_Process__c,
                   Next_Step__c, Next_Step_History__c, SC_Next_Steps_History__c
            FROM Opportunity WHERE Id = :oppId WITH USER_MODE LIMIT 1
        ];

        Id acctId = dms[0].Account__c;
        Boolean acct = wholeAccount && acctId != null;
        List<Task> tasks = acct ? [
            SELECT Id, Subject, Type, TaskSubtype, ActivityDate, CreatedDate, WhoId, Who.Name, Owner.Name
            FROM Task
            WHERE AccountId = :acctId AND IsClosed = true AND (Type != 'Marketing Email')
            WITH USER_MODE
            ORDER BY CreatedDate DESC LIMIT :ROW_CAP
        ] : [
            SELECT Id, Subject, Type, TaskSubtype, ActivityDate, CreatedDate, WhoId, Who.Name, Owner.Name
            FROM Task
            WHERE WhatId = :oppId AND IsClosed = true AND (Type != 'Marketing Email')
            WITH USER_MODE
            ORDER BY CreatedDate DESC LIMIT :ROW_CAP
        ];
        Datetime nowDt = System.now();
        List<Event> events = acct ? [
            SELECT Id, Subject, StartDateTime, WhoId, Who.Name, Owner.Name
            FROM Event
            WHERE AccountId = :acctId AND StartDateTime <= :nowDt
            WITH USER_MODE
            ORDER BY StartDateTime DESC LIMIT :ROW_CAP
        ] : [
            SELECT Id, Subject, StartDateTime, WhoId, Who.Name, Owner.Name
            FROM Event
            WHERE WhatId = :oppId AND StartDateTime <= :nowDt
            WITH USER_MODE
            ORDER BY StartDateTime DESC LIMIT :ROW_CAP
        ];
        res.capped = tasks.size() >= ROW_CAP || events.size() >= ROW_CAP;

        Date today = Date.today();
        Date firstWeek = today.toStartOfWeek().addDays(-7 * (WEEKS - 1));
        for (Integer i = 0; i < WEEKS; i++) {
            Week w = new Week();
            w.label = String.valueOf(firstWeek.addDays(7 * i));
            res.weeks.add(w);
        }

        List<Item> items = new List<Item>();
        Map<Id, Integer> touchCount = new Map<Id, Integer>();
        Map<Id, Date> touchLast = new Map<Id, Date>();
        Map<String, Date> lastByKind = new Map<String, Date>();

        for (Task t : tasks) {
            if (t.Type == 'Marketing Email') { continue; }
            String kind = kindOf(t);
            Date d = t.ActivityDate != null ? t.ActivityDate : t.CreatedDate.date();
            addItem(items, res, lastByKind, firstWeek, today, t.Id, kind, d, t.Subject, t.Who == null ? null : t.Who.Name, t.Owner.Name);
            tally(touchCount, touchLast, t.WhoId, d);
        }
        for (Event e : events) {
            Date d = e.StartDateTime.date();
            addItem(items, res, lastByKind, firstWeek, today, e.Id, 'meeting', d, e.Subject, e.Who == null ? null : e.Who.Name, e.Owner.Name);
            tally(touchCount, touchLast, e.WhoId, d);
        }

        res.lastMeeting = str(lastByKind.get('meeting'));
        res.lastMomentum = str(lastByKind.get('momentum'));
        res.lastEmailIn = str(lastByKind.get('emailIn'));
        res.lastEmailOut = str(lastByKind.get('emailOut'));

        items.sort();
        for (Integer i = 0; i < items.size() && i < TIMELINE_MAX; i++) { res.timeline.add(items[i]); }

        buildPeople(res, opp, oppId, touchCount, touchLast);
        buildRoleFields(res, opp);
        return res;
    }

    @TestVisible
    private static String kindOf(Task t) {
        String ty = t.Type == null ? '' : t.Type;
        if (ty == 'Momentum AI Summary') { return 'momentum'; }
        if (ty == 'Email In') { return 'emailIn'; }
        if (t.TaskSubtype == 'Email' || ty == 'Email') { return 'emailOut'; }
        if (t.TaskSubtype == 'Call' || ty == 'Call') { return 'call'; }
        return 'other';
    }

    private static void addItem(List<Item> items, Result res, Map<String, Date> lastByKind, Date firstWeek, Date today,
                                Id recId, String kind, Date d, String subject, String who, String owner) {
        Item it = new Item();
        it.id = recId;
        it.kind = kind;
        it.day = String.valueOf(d);
        it.subject = subject == null ? '' : subject.left(120);
        it.who = who;
        it.owner = owner;
        items.add(it);
        Date prev = lastByKind.get(kind);
        if (prev == null || d > prev) { lastByKind.put(kind, d); }
        Integer idx = firstWeek.daysBetween(d) / 7;
        if (d >= firstWeek && d <= today && idx >= 0 && idx < WEEKS) {
            Week w = res.weeks[idx];
            if (kind == 'meeting') { w.meetings++; }
            else if (kind == 'call' || kind == 'momentum') { w.calls++; }
            else if (kind == 'emailIn' || kind == 'emailOut') { w.emails++; }
            else { w.other++; }
            res.last8Weeks++;
        }
    }

    private static void tally(Map<Id, Integer> cnt, Map<Id, Date> last, Id whoId, Date d) {
        if (whoId == null || whoId.getSObjectType() != Contact.SObjectType) { return; }
        cnt.put(whoId, (cnt.containsKey(whoId) ? cnt.get(whoId) : 0) + 1);
        Date prev = last.get(whoId);
        if (prev == null || d > prev) { last.put(whoId, d); }
    }

    private static String str(Date d) { return d == null ? null : String.valueOf(d); }

    private static void buildPeople(Result res, Opportunity opp, Id oppId, Map<Id, Integer> cnt, Map<Id, Date> last) {
        Map<Id, OpportunityContactRole> ocr = new Map<Id, OpportunityContactRole>();
        for (OpportunityContactRole r : [
            SELECT ContactId, Role, IsPrimary FROM OpportunityContactRole WHERE OpportunityId = :oppId WITH USER_MODE LIMIT 200
        ]) { ocr.put(r.ContactId, r); }
        Set<Id> ids = new Set<Id>(ocr.keySet());
        ids.addAll(cnt.keySet());
        if (opp.ContactId != null) { ids.add(opp.ContactId); }
        if (opp.DecisionMaker__c != null) { ids.add(opp.DecisionMaker__c); }
        if (ids.isEmpty()) { return; }

        String champ = low(opp.Champion__c);
        String econ = low(opp.Economic_Buyer__c);
        String proc = low(opp.Decision_Process__c);
        String hist = low(opp.Next_Step__c) + ' ' + low(opp.Next_Step_History__c) + ' ' + low(opp.SC_Next_Steps_History__c);

        List<Person> people = new List<Person>();
        for (Contact c : [
            SELECT Id, Name, Title, Job_Title_Segment__c FROM Contact WHERE Id IN :ids WITH USER_MODE LIMIT 200
        ]) {
            Person p = new Person();
            p.id = c.Id;
            p.name = c.Name;
            p.title = c.Title;
            p.level = levelOf(c.Title);
            if (c.Job_Title_Segment__c != null && c.Job_Title_Segment__c != 'No Title' && c.Job_Title_Segment__c != 'Not a Fit') {
                p.persona = c.Job_Title_Segment__c;
            }
            OpportunityContactRole r = ocr.get(c.Id);
            if (r != null && r.Role != null) { p.tags.add('Contact role: ' + r.Role); }
            if ((r != null && r.IsPrimary) || c.Id == opp.ContactId) { p.tags.add('Primary contact'); }
            if (c.Id == opp.DecisionMaker__c) { p.tags.add('Decision maker field'); }
            String nm = low(c.Name);
            if (nm.length() >= 5) {
                if (champ.contains(nm)) { p.tags.add('Named in Champion'); }
                if (econ.contains(nm)) { p.tags.add('Named in Economic buyer'); }
                if (proc.contains(nm)) { p.tags.add('Named in Decision process'); }
                Integer n = mentions(hist, nm);
                if (n > 0) { p.tags.add('In next steps ' + n + 'x'); }
            }
            p.touches = cnt.containsKey(c.Id) ? cnt.get(c.Id) : 0;
            p.lastTouch = str(last.get(c.Id));
            p.identified = !p.tags.isEmpty() || p.level != null || p.persona != null || String.isNotBlank(c.Title);
            people.add(p);
        }
        res.contactsTotal = people.size();
        for (Person p : people) { if (p.touches > 0) { res.contactsTouched++; } }
        people.sort(new PersonSort());
        for (Integer i = 0; i < people.size() && i < PEOPLE_MAX; i++) { res.people.add(people[i]); }
    }

    public class PersonSort implements System.Comparator<Person> {
        public Integer compare(Person a, Person b) {
            Integer sa = a.tags.size() * 100 + a.touches;
            Integer sb = b.tags.size() * 100 + b.touches;
            if (sa == sb) { return 0; }
            return sa > sb ? -1 : 1;
        }
    }

    private static void buildRoleFields(Result res, Opportunity opp) {
        addField(res, 'Champion', opp.Champion__c);
        addField(res, 'Economic buyer', opp.Economic_Buyer__c);
        addField(res, 'Decision process', opp.Decision_Process__c);
        addField(res, 'Next step', opp.Next_Step__c);
    }

    private static void addField(Result res, String label, String val) {
        if (String.isBlank(val)) { return; }
        Field f = new Field();
        f.label = label;
        f.value = val.abbreviate(300);
        res.roleFields.add(f);
    }

    private static String low(String s) { return s == null ? '' : s.toLowerCase(); }

    private static Integer mentions(String hay, String needle) {
        Integer n = 0;
        Integer i = hay.indexOf(needle);
        while (i >= 0 && n < 99) {
            n++;
            i = hay.indexOf(needle, i + needle.length());
        }
        return n;
    }

    public static String levelOf(String title) {
        if (String.isBlank(title)) { return null; }
        String t = ' ' + title.toLowerCase() + ' ';
        if (t.contains('chief') || t.contains('founder') || t.contains('president') && !t.contains('vice') || t.contains(' ceo ') || t.contains(' cfo ')
            || t.contains(' cmo ') || t.contains(' cto ') || t.contains(' coo ') || t.contains(' cio ') || t.contains(' cro ') || t.contains(' owner ')) { return 'C-level'; }
        if (t.contains('vp') || t.contains('vice president') || t.contains('svp') || t.contains('evp')) { return 'VP'; }
        if (t.contains('director') || t.contains('head of')) { return 'Director'; }
        if (t.contains('manager') || t.contains(' lead')) { return 'Manager'; }
        return null;
    }
}