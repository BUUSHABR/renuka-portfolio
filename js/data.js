/* ==========================================================================
   PORTFOLIO CONTENT — edit this file to update the website.
   --------------------------------------------------------------------------
   To ADD A NEW PROJECT:
     1. Put the images in  assets/renders/  (3D views / photos)
        and drawings in    assets/sheets/   (plans, sections, elevations).
     2. Copy one project block below, paste it at the TOP of `projects`,
        and change the text + image file names.
        `model` picks the 3D study model (residence, hotel, mandapam,
        school, court, bedroom, hall, clinic) — or set `modelFile` to a
        .glb exported from SketchUp to show the real model.
        Each image has a `label` — what the picture shows
        ("Ground floor plan", "Living room"). Name image files by
        what they show, e.g. assets/sheets/09-ground-floor-plan.jpg
     3. Save, commit and push. GitHub Pages updates in about a minute.
   Numbers (01, 02 …) are generated automatically from the order.
   ========================================================================== */

window.PORTFOLIO = {
  person: {
    name: "Renuka Sivakumar",
    title: "Architect",
    prefix: "Ar.",
    tagline: "Planning, detailing and interiors — from first sketch to site.",
    intro:
      "Architect with three years of hands-on experience in planning, detailing and service coordination. I have worked on residences, hotels, kalyana mandapams, schools and hospital interiors across Tamil Nadu, and I care most about well-executed spaces that stay comfortable to live in.",
    photo: "assets/img/renuka.jpg",
    email: "renukabr2822@gmail.com",
    phone: "+91 94888 47747",
    whatsapp: "919488847747",
    location: "Sattur, Virudhunagar, Tamil Nadu",
    cv: "assets/Renuka-CV.pdf",
    years: "2022 — 2025",
  },

  stats: [
    { value: 3, suffix: "+", label: "Years in practice" },
    { value: 8, suffix: "", label: "Selected works" },
    { value: 139, suffix: "K+", label: "Sq.ft drawn & detailed" },
    { value: 5, suffix: "", label: "Building typologies" },
  ],

  projects: [
    {
      title: "Mr. Vinoth Residence",
      location: "Vellaikovil, Tamil Nadu",
      category: "Architecture",
      type: "Residence",
      facts: [
        ["Built-up", "5,447 sq.ft"],
        ["Programme", "5-bedroom home"],
        ["Style", "Modern contemporary"],
      ],
      description: [
        "A 5,447 sq.ft modern contemporary home that blends functionality with elegance. The five-bedroom house features a foyer, living and drawing hall, gym and a private lounge, each tailored to the client's requirements.",
        "Developed under the guidance of Architect Bhuvanasundar, the design emphasises open spaces, natural light and a comfortable environment for today's lifestyle.",
      ],
      model: "residence",            // 3D study model (see js/models.js)
      // modelFile: "assets/models/01.glb", // optional: real exported model replaces it
      cover: "assets/renders/01-front-view.jpg",
      renders: [{ src: "assets/renders/01-front-view.jpg", label: "Front view" }],
      sheets: [
        { src: "assets/sheets/01-ground-floor-plan.jpg", label: "Ground floor plan" },
        { src: "assets/sheets/01-first-floor-plan.jpg", label: "First floor plan" },
        { src: "assets/sheets/01-terrace-floor-plan.jpg", label: "Terrace floor plan" },
        { src: "assets/sheets/01-working-elevation-east.jpg", label: "Working elevation — east" },
        { src: "assets/sheets/01-working-elevation-north.jpg", label: "Working elevation — north" },
      ],
    },
    {
      title: "M/s. Hotel Manis",
      location: "Perundurai, Tamil Nadu",
      category: "Architecture",
      type: "Hospitality",
      facts: [
        ["Built-up", "36,767 sq.ft"],
        ["Floors", "Stilt + G + 3 + terrace"],
        ["Highlights", "Banquet hall, rooftop pool"],
      ],
      description: [
        "A 36,767 sq.ft hotel with stilt parking, dual entry and modern architecture. The ground to second floors hold rooms, the third floor features a banquet hall and dining, and the terrace offers a swimming pool.",
        "The exterior combines exposed concrete, travertine stone, aluminium louvers and structural glazing.",
      ],
      model: "hotel",            // 3D study model (see js/models.js)
      // modelFile: "assets/models/02.glb", // optional: real exported model replaces it
      cover: "assets/renders/02-street-view.jpg",
      renders: [{ src: "assets/renders/02-street-view.jpg", label: "Street view" }],
      sheets: [
        { src: "assets/sheets/02-site-plan-semi-basement-plan.jpg", label: "Site plan & semi-basement plan" },
        { src: "assets/sheets/02-ground-first-floor-plans.jpg", label: "Ground & first floor plans" },
        { src: "assets/sheets/02-second-third-floor-plans.jpg", label: "Second & third floor plans" },
        { src: "assets/sheets/02-section-aa.jpg", label: "Section AA" },
        { src: "assets/sheets/02-section-bb.jpg", label: "Section BB" },
        { src: "assets/sheets/02-working-elevation-north.jpg", label: "Working elevation — north" },
        { src: "assets/sheets/02-working-elevation-east.jpg", label: "Working elevation — east" },
        { src: "assets/sheets/02-working-elevation-south.jpg", label: "Working elevation — south" },
        { src: "assets/sheets/02-working-elevation-west.jpg", label: "Working elevation — west" },
      ],
    },
    {
      title: "Sampritaa Mahal",
      location: "Sathyamangalam, Erode",
      category: "Architecture",
      type: "Kalyana Mandapam",
      facts: [
        ["Built-up", "72,659 sq.ft"],
        ["Parking", "64 cars at stilt"],
        ["Roof", "Sheet + concrete"],
      ],
      description: [
        "A proposed kalyana mandapam with a built-up area of 72,659 sq.ft. The stilt floor includes a kitchen, dining area, mini hall and parking for 64 cars. The first floor holds the main marriage hall, bride and groom rooms, buffet, dining and an additional kitchen.",
        "The hall and its dining and kitchen areas sit under a sheet roof, while the rest has a concrete roof. Outside, a refined plaster finish in contrasting light and dark tones, vertical walls with strip lights and stone-finished elements give the facade a bold rhythm.",
      ],
      model: "mandapam",            // 3D study model (see js/models.js)
      // modelFile: "assets/models/03.glb", // optional: real exported model replaces it
      cover: "assets/renders/03-entrance-view.jpg",
      renders: [{ src: "assets/renders/03-entrance-view.jpg", label: "Entrance view" }],
      sheets: [
        { src: "assets/sheets/03-site-plan-stilt-floor-plan.jpg", label: "Site plan & stilt floor plan" },
        { src: "assets/sheets/03-first-floor-plan.jpg", label: "First floor plan" },
        { src: "assets/sheets/03-second-terrace-floor-plans.jpg", label: "Second & terrace floor plans" },
        { src: "assets/sheets/03-elevations-all-four-sides.jpg", label: "Elevations — all four sides" },
      ],
    },
    {
      title: "Thirumalai Academy",
      location: "Tenkasi, Tamil Nadu",
      category: "Architecture",
      type: "Institutional",
      facts: [
        ["Built-up", "20,330 sq.ft"],
        ["Floors", "G + 2"],
        ["Plan", "Central lawn & courtyard"],
      ],
      description: [
        "A G+2 school spanning 20,330 sq.ft, planned around a central lawn and courtyard. The layout holds classrooms, labs, a library and toilets as per academic norms.",
        "The elevation blends brick stone and exposed concrete finishes with steel trellis and vertical elements, for a modern yet robust appearance.",
      ],
      model: "school",            // 3D study model (see js/models.js)
      // modelFile: "assets/models/04.glb", // optional: real exported model replaces it
      cover: "assets/renders/04-campus-view.jpg",
      renders: [{ src: "assets/renders/04-campus-view.jpg", label: "Campus view" }],
      sheets: [
        { src: "assets/sheets/04-ground-floor-plan.jpg", label: "Ground floor plan" },
        { src: "assets/sheets/04-first-floor-plan.jpg", label: "First floor plan" },
        { src: "assets/sheets/04-second-floor-plan.jpg", label: "Second floor plan" },
        { src: "assets/sheets/04-terrace-floor-plan.jpg", label: "Terrace floor plan" },
        { src: "assets/sheets/04-elevations-east-north.jpg", label: "Elevations — east & north" },
        { src: "assets/sheets/04-elevations-south-west.jpg", label: "Elevations — south & west" },
      ],
    },
    {
      title: "Shuttle Court Building",
      location: "Advaita Montessori School, Tiruppur",
      category: "Architecture",
      type: "Sports",
      facts: [
        ["Built-up", "3,696 sq.ft"],
        ["Structure", "Steel columns & truss"],
        ["Cladding", "ACP with cove lighting"],
      ],
      description: [
        "A 3,696 sq.ft shuttle court for Advaita Montessori School, designed with a robust steel structure of columns and trusses.",
        "The exterior is clad in ACP panels with integrated cove lighting, so the building feels at home on the school's contemporary campus.",
      ],
      model: "court",            // 3D study model (see js/models.js)
      // modelFile: "assets/models/05.glb", // optional: real exported model replaces it
      cover: "assets/renders/05-approach-view.jpg",
      renders: [{ src: "assets/renders/05-approach-view.jpg", label: "Approach view" }, { src: "assets/renders/05-facade-panel-detail.jpg", label: "Facade panel detail" }],
      sheets: [
        { src: "assets/sheets/05-ground-floor-plan.jpg", label: "Ground floor plan" },
        { src: "assets/sheets/05-section-roof-details.jpg", label: "Section & roof details" },
        { src: "assets/sheets/05-elevations-all-four-sides.jpg", label: "Elevations — all four sides" },
      ],
    },
    {
      title: "Residential Interior",
      location: "Hosur, Tamil Nadu",
      category: "Interior",
      type: "Residential interior",
      facts: [
        ["Daughter's room", "340 sq.ft"],
        ["Style", "Elegant classical"],
        ["Spaces", "Bedrooms & living"],
      ],
      description: [
        "The 340 sq.ft daughter's bedroom is designed in an elegant classical style: wooden-finish wardrobes, plaster-finished walls and beadings that run through the wardrobe panels.",
        "Intricate mouldings and custom carvings add detail, while a luxurious bed, mirrored wardrobes and a cosy seating corner sit in warm light.",
      ],
      model: "bedroom",            // 3D study model (see js/models.js)
      // modelFile: "assets/models/06.glb", // optional: real exported model replaces it
      cover: "assets/renders/06-daughters-room.jpg",
      renders: [
        { src: "assets/renders/06-daughters-room.jpg", label: "Daughter's room" },
        { src: "assets/renders/06-daughters-room-seating.jpg", label: "Daughter's room — seating" },
        { src: "assets/renders/06-master-bedroom.jpg", label: "Master bedroom" },
        { src: "assets/renders/06-master-bedroom-tv-wall.jpg", label: "Master bedroom — TV wall" },
        { src: "assets/renders/06-study-tv-wall.jpg", label: "Study & TV wall" },
      ],
      sheets: [
        { src: "assets/sheets/06-daughters-room-plan-sections-details.jpg", label: "Daughter's room — plan, sections & details" },
        { src: "assets/sheets/06-daughters-room-elevations.jpg", label: "Daughter's room — elevations" },
        { src: "assets/sheets/06-bedroom-part-plan-elevations.jpg", label: "Bedroom — part plan & elevations" },
        { src: "assets/sheets/06-master-bedroom-elevations.jpg", label: "Master bedroom — elevations" },
        { src: "assets/sheets/06-false-ceiling-plan-mouldings.jpg", label: "False ceiling plan & mouldings" },
      ],
    },
    {
      title: "Kalyana Mandapam Interior",
      location: "Bargoor, Tamil Nadu",
      category: "Interior",
      type: "Marriage hall interior",
      facts: [
        ["Capacity", "800 guests"],
        ["Concept", "Indoor–outdoor"],
        ["Focus", "Light & openness"],
      ],
      description: [
        "A contemporary marriage hall for up to 800 guests. Large window openings frame views of the adjoining lawn for a seamless indoor-outdoor experience.",
        "The design emphasises natural light, openness and functionality, blending modern aesthetics with comfort for grand celebrations.",
      ],
      model: "hall",            // 3D study model (see js/models.js)
      // modelFile: "assets/models/07.glb", // optional: real exported model replaces it
      cover: "assets/renders/07-marriage-hall.jpg",
      renders: [
        { src: "assets/renders/07-marriage-hall.jpg", label: "Marriage hall" },
        { src: "assets/renders/07-corridor.jpg", label: "Corridor" },
        { src: "assets/renders/07-hall-seating.jpg", label: "Hall seating" },
      ],
      sheets: [
        { src: "assets/sheets/07-interior-ground-floor-plan.jpg", label: "Interior ground floor plan" },
        { src: "assets/sheets/07-interior-elevations-north-east.jpg", label: "Interior elevations — north & east" },
        { src: "assets/sheets/07-interior-elevations-south-west.jpg", label: "Interior elevations — south & west" },
        { src: "assets/sheets/07-false-ceiling-layout-sections.jpg", label: "False ceiling layout & sections" },
        { src: "assets/sheets/07-detail-drawing-elevations.jpg", label: "Detail drawing — elevations" },
        { src: "assets/sheets/07-enlarged-details.jpg", label: "Enlarged details" },
      ],
    },
    {
      title: "Nishanth Hospital Interior",
      location: "Erode, Tamil Nadu",
      category: "Interior",
      type: "Healthcare interior",
      facts: [
        ["Palette", "Soft pastels"],
        ["Finishes", "Wood laminate, marble"],
        ["Spaces", "Reception, clinic, recovery"],
      ],
      description: [
        "A modern interior in pastel shades that create a calm, soothing ambience. Walls are finished in soft paint tones, doors in elegant wooden laminate, and a sleek wooden reception table adds warmth.",
        "The recovery room pairs rich wood panelling above with sleek marble below for a clean, hygienic feel; soft lighting, privacy curtains and minimal décor keep it restful.",
      ],
      model: "clinic",            // 3D study model (see js/models.js)
      // modelFile: "assets/models/08.glb", // optional: real exported model replaces it
      cover: "assets/renders/08-consultation-room.jpg",
      renders: [
        { src: "assets/renders/08-consultation-room.jpg", label: "Consultation room" },
        { src: "assets/renders/08-recovery-room.jpg", label: "Recovery room" },
        { src: "assets/renders/08-reception-waiting.jpg", label: "Reception — waiting" },
        { src: "assets/renders/08-reception-counter.jpg", label: "Reception — counter" },
      ],
      sheets: [
        { src: "assets/sheets/08-consultation-room-plan-elevations.jpg", label: "Consultation room — plan & elevations" },
        { src: "assets/sheets/08-recovery-room-ceiling-plan-sections.jpg", label: "Recovery room — ceiling plan & sections" },
        { src: "assets/sheets/08-part-plan-elevations-ceiling.jpg", label: "Part plan, elevations & ceiling" },
        { src: "assets/sheets/08-cash-counter-table-detail.jpg", label: "Cash counter — table detail" },
      ],
    },
  ],

  experience: [
    {
      period: "Sep 2022 — Jul 2025",
      role: "Junior Architect",
      org: "Sundar Sundram Architects",
      place: "Coimbatore, Tamil Nadu",
      points: [
        "Developed efficient grid-pattern planning schemes with functional, aesthetic zoning and basic vastu principles.",
        "Integrated HVAC drawings into false ceiling layouts, keeping services and interiors coordinated.",
        "Handled mandapams, hospitals, institutional and residential buildings from planning to execution.",
        "Produced detailed working drawings, sections and elevations for structural, interior and service components.",
      ],
    },
    {
      period: "Aug 2021 — Dec 2021",
      role: "Architectural Intern",
      org: "SPR Construction Pvt. Ltd (SPR City)",
      place: "Chennai, Tamil Nadu",
      points: [],
    },
    {
      period: "2017 — 2022",
      role: "Bachelor of Architecture",
      org: "RVS Padmavathy School of Architecture",
      place: "Chennai, Tamil Nadu",
      points: [],
    },
  ],

  workshops: [
    { name: "Community Build", by: "Nivasa", place: "Bangalore" },
    { name: "Bamboo Workshop", by: "Cibart", place: "Himachal Pradesh" },
    { name: "Vertical Studio", by: "Ar. Vinodaranha", place: "Mangalore" },
  ],

  software: ["AutoCAD", "SketchUp", "V-Ray", "Enscape", "Lumion", "Photoshop", "InDesign", "MS Word", "Excel"],
  skills: ["Concept Development", "Model Making", "Sketching", "Working Drawings", "Service Coordination", "Team Collaboration", "Attention to Detail"],
  languages: ["Tamil", "English", "Telugu"],
};
