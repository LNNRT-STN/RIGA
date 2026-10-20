 using our existing frontend create the KBC trust feature / ecosystem.

    follow our guide:
    KBC Trust
    Not security just trust
    We trust KBC so we trust the trustees of KBC

    Goal
    Show proof of concept inside the KBC app.
    Provide a clear strategy on how the trust system works.

    How does the Trust System work
    Integrated in KATE
    (zero trust architecture)
    Human in the loop for automated actions
    Trust works both passively in kate you upload inoices, mails and check wether they are trustworthy. But also proactively: KBC trust within kate notify’s users of dangerous transactions behaviour before the user can execute them.
    Customer control: which data shared, ability to change it
    Triple win! Customer: no scams, instant “is this real?” answers ;KBC: fewer PSR spoofing refunds, partner revenue, more trust; Partners: less brand abuse, fewer support calls, correct payments
    Scalability: Open protocol and API for any partner; new threats become new modules.
    Measurable outcome: € fraud prevented, % of payments to verified senders, time to answer “is this real?” (aim for under 5 seconds).
    Read in KBC security: what they do now (to know the current capabilities)
    Verified by kbc partner (how does it work and why will partners join, explain the model)


    What is the emerging need

    There is no way to tell if anything is real, authentic and trustworthy. Especially in the AI age.

    Deloitte estimates that generative AI could help drive annual US fraud losses from $12.3 billion in 2023 to $40 billion by 2027.

    What can our Trust solution provide to KBC (use cases)
    Prove that something is real for customers:  Invoice (physical, electronic)
    Phone call, video call                                                                                                                                                            Physical employee, “virtual” person
    Image / video                                                                                                                                                                     Bank account ownership
    Job offer                                                                                                                                                                         Website
    Automatically scans transactions and flags unusual activity customers                                                                                                             Compare against usual activity in the past
    Money muling detection                                                                                                                                                            Report if bankaccount was used in previous scams
    Provide certified partners authentication of their Invoices / employees / mail                                                                                                    Companies integrate with KBC and KBC provides a portal where companies can KATE (mostly related to subscriptions).
    Internally KBC: Predict what future scams are gonna look like based on internal+external data                                                                                     Connect with cybersecurity firms
    Connect with anti social engineering firms to provide security on upcoming                                                                                                      
    Demonstration we will show in the pitch                                                                                                                                           Customers: Scan invoice pdf in kate with OCR but flags
    Not a certified partner proximus                                                                                                                                                  Gives the phone call of the certified partner proximus
    Business:                                                                                                                                                                         Scam Phone call internally in the company from CEO
    AI video check detection                                                                                                                                                          Verify bank account number not belonging to company
                                                                                                                                                                                    
    Slides:                                                                                                                                                                         
    Deepfake CEO call                                                                                                                                                                 This is not security it’s trust
                                                                                                                                                                                      Alignment with requirements:
    Customer intent: clean flow to handle this                                                                                                                                        vb. I want to book my holiday safely (for travel).
    Vb. businesses: growing business without fake invoice                                                                                                                           
    Journey map:                                                                                                                                                                      One map showing what the person/entrepeneur does step by step, and then mayurrently difficult
                                                                                                                                                                                    
                                                                                                                                                                                      focus on 2 examples:
    1                                                                                                                                                                                 Customers: Scan invoice pdf in kate with OCR but flags
    Not a certified partner proximus                                                                                                                                                  Gives the phone call of the certified partner proximus
    2 business fraud internally or externally with fake mails, deepfakes changed supplier account numbers inspire from stripe radar and how kbc could provide similar services.       What to take from Radar
                                                                                                                                                                                      1. One risk score, shown everywhere. Radar condenses all its signals into aows a business profile with a 0–100 risk score, a “verified businessidentity” signal and an identity match. Do the same in Kate: every invoice, IBAN, caller or website gets a KBC Trust Score, with green “Verified by KBC” at the top. That one visucarries your whole demo.
    stripe                                                                                                                                                                          
    2. The network effect is your strongest argument. Radar’s selling point is that its AI is trained on more than 70 trillion data points across the Stripe network, and there’s a 92% chance a card has already been seen before. KBC has the same advantage loorts a fake IBAN, every other KBC customer is warned before paying it. Saythis out loud. It’s why KBC wins this and a startup can’t.                                                                                                                          stripe
                                                                                                                                                                                      3. Protect the whole journey, not one moment. Radar splits protection into t, and ongoing use. That fits your plan neatly:
    stripe                                                                                                                                                                          
    Onboarding = partners get verified (KBC checks the company, IBAN and sender domains)                                                                                              Payment = Kate checks the invoice/IBAN before you pay
    Ongoing = behaviour monitoring, money-mule detection                                                                                                                            
    4. Rules plus a human review queue. This is your “human in the loop”, made concrete: automatic block above a threshold, a Kate warning in the middle, Secure4u review for the   uncertain cases.
                                                                                                                                                                                      5. Partner API. Radar can be used with any processor, and its signals are atransactions and accounts in your own system. That’s your “open protocol forpartners”.                                                                                                                                                                          stripe
                                                                                                                                                                                      Things you need to address (the jury will know them)
                                                                                                                                                                                      KBC already has two related features, so present yours as the next step, no
                                                                                                                                                                                      Check who’s there: lets customers quickly check whether they’re really talkoday you can check whether KBC is calling. With KBC Trust you can checkwhether anyone is real: Proximus, your supplier, your CEO.”                                                                                                                         kbc
    Guardian Angel (February 2026): a customer can appoint a trusted person who is digitally notified when fraud is suspected. Use this as escalation: high-risk transaction → Kate warns → the Guardian Angel gets notified. That’s a nice human-in-the-loop momC already has.
    kbc

    Also: since October 2025, EU banks have had to run Verification of Payee (name/IBAN match). So “bank account ownership” is partly already covered. Your added value is the context
  (is this company really your supplier? Is this IBAN known from earlier scams?lf.
    Use /impeccable for clean ui and ux put the solution first, use progressive disclosure as in the apple guidelines for human interface. We need to be able to pitch it in 3
  minutes.

    Use python for the backend.
    React with vite for frontend, mockup app is already in the project

    read assignment/slide_assignment.md

  ❯ permission to use subagents where usefull

  ❯ tailor or proof on concept to this
    Demonstration we will show in the pitch
    Customers: Scan invoice pdf in kate with OCR but flags
    Not a certified partner proximus
    Gives the phone call of the certified partner proximus
    Business:
    Scam Phone call internally in the company from CEO
    AI video check detection
    Verify bank account number not belonging to company
    This is what we will pitch