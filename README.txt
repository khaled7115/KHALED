Virtual Siebel (demo) - all data is fictional
=============================================
Open index.html in any browser. No server needed, works offline / on GitHub Pages.

Test data
  MSISDN              0125930480   (also works without the leading 0)
  Contract IDs        100200301 (main), 100200302, 100200303
  Parent cust. codes  1.100200301, 1.100200302, 1.100200303

Flow
  Home -> Accounts -> Service Account List
  -> type 0125930480 in the search box, press Enter or the arrow button
  -> click Contract ID 100200301      -> Service Requests view
  -> click Parent Customer Code       -> Customer account view
  -> bottom tabs / drop-down          -> Service Requests, Billing Details, Charging Details

Drop-down arrows
  The arrow next to the search box lets you pick the search field
  (MSISDN, Contract ID, Parent Customer Code, Status ...).
  Arrows inside forms open lists of values; calendar icons open a date picker.

Anything else shows a "not available in this demo" message.
