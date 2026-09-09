/**
 * Part hierarchy for the BMW M4 CSL configurator.
 * Ids are dotted paths; the parent is the id with its last segment removed ('car' is the root).
 * `node` maps a part to a mesh/node name in the loaded GLB; parts without a node are built procedurally (src/build).
 */
export type Part = {
  id: string
  parent: string
  name: string
  desc: string      // what it is
  fn: string        // what it does
  material: string
  spec: string      // realistic figures for an S58-powered M4 CSL
  maint: string     // common failure / maintenance note
  price?: number    // typical replacement part price, USD
  node?: string | string[]
}

const list: Part[] = []
function p(id: string, name: string, desc: string, fn: string, material: string, spec: string, maint: string, price?: number, node?: string | string[]) {
  const parent = id === 'car' ? '' : id.includes('.') ? id.slice(0, id.lastIndexOf('.')) : 'car'
  list.push({ id, parent, name, desc, fn, material, spec, maint, price, node })
}

/* ------------------------------------------------------------------ root */
p('car', 'BMW M4 CSL', 'Two-door, two-seat competition coupé, 1,000 units built in 2022–23.', 'Fastest series BMW around the Nürburgring at launch: 7:20.2.', 'Steel/aluminium unibody, CFRP roof, hood, trunk lid, seats', '4,794 × 1,887 × 1,399 mm · wheelbase 2,857 mm · 1,625 kg DIN · 0–100 km/h 3.7 s · 307 km/h', 'Oil service every 15,000 km or 12 months; spark plugs at 60,000 km.', 139900)

/* ------------------------------------------------------------------ engine */
p('engine', 'S58 engine', 'BMW M 3.0-litre twin-turbocharged inline-six, CSL tune.', 'Converts fuel into 543 hp at 6,250 rpm and 650 Nm from 2,750–5,950 rpm.', 'Closed-deck aluminium block, aluminium head, forged steel crank', '2,993 cc · bore 84 mm · stroke 90 mm · 9.3:1 · redline 7,200 rpm · ~2.3 bar boost', 'Uses ~0.5 l of oil per 1,000 km under track use; check level at each fuel stop.', 24500, 'engine')
p('engine.block', 'Cylinder block', 'Closed-deck aluminium crankcase with wire-arc-sprayed iron bore liners.', 'Houses the six cylinders, crankshaft and coolant/oil galleries; carries the head and gearbox.', 'AlSi cast aluminium, twin-wire arc-sprayed bores', 'Bore spacing 91 mm · deck height 226 mm · ~68 kg bare', 'Closed deck resists head-gasket lift at high boost; bore scoring is rare but not unknown after coolant loss.', 6800)
p('engine.head', 'Cylinder head', 'Aluminium DOHC 24-valve head with a 3D-printed core for the coolant jacket.', 'Seals the combustion chambers, guides intake/exhaust flow, carries camshafts and valvetrain.', 'Cast aluminium, sintered valve seats', '4 valves/cyl · intake 32 mm, exhaust 28 mm · 24 kg', 'Valve-cover gasket seep at 80,000+ km; head itself rarely fails.', 5200)
p('engine.headgasket', 'Head gasket', 'Multi-layer steel gasket between block and head.', 'Seals combustion pressure, coolant and oil passages between block and head.', '3-layer stainless MLS with elastomer beads', 'Compressed thickness 1.0 mm · rated for 150 bar peak cylinder pressure', 'Failure shows as coolant loss, white exhaust or bubbling in the expansion tank.', 180)
p('engine.valvecover', 'Valve cover', 'Composite cover over the camshafts with integrated oil separator.', 'Keeps oil in and dirt out of the valvetrain; the PCV separator returns oil mist to the sump.', 'Glass-fibre reinforced PA66', 'Torque 10 Nm in sequence · PCV crack pressure 60 mbar', 'PCV diaphragm can tear, causing a whistle and rough idle; replace the cover as an assembly.', 420)
p('engine.oilpan', 'Oil pan', 'Cast aluminium sump with baffles and a magnetic drain plug.', 'Stores 6.5 litres of engine oil and feeds the oil-pump pickup under cornering loads.', 'Cast aluminium, aluminium drain plug', 'Capacity 6.5 l · drain plug 25 Nm · M12 x 1.5', 'Aluminium threads strip if the drain plug is over-torqued; use a new crush washer each service.', 560)
p('engine.oilpump', 'Oil pump', 'Variable-displacement vane pump driven by chain off the crank.', 'Pressurises oil to bearings, cam phasers and piston-cooling jets; map-controlled pressure saves power.', 'Sintered steel rotor in aluminium housing', '2-stage pressure map, 2.0 / 4.5 bar · 40 l/min at 6,000 rpm', 'Low oil pressure warning at idle usually means the solenoid, not the pump.', 640)
p('engine.waterpump', 'Water pump', 'Mechanical impeller pump on the front of the block, belt driven.', 'Circulates coolant through block, head, turbos, intercooler circuit and radiator.', 'Aluminium housing, composite impeller', '~250 l/min at 6,000 rpm', 'Weep hole seepage is the classic early warning; replace with the thermostat.', 310)
p('engine.thermostat', 'Thermostat', 'Map-controlled electric thermostat in the coolant outlet.', 'Holds coolant at 90–105 °C for economy, drops to 80 °C under load for knock margin.', 'Wax element with PTC heater, plastic housing', 'Opens 103 °C unheated, 80 °C heated', 'Stuck-open thermostat shows as slow warm-up and a fault code for coolant temperature plausibility.', 140)
p('engine.intake', 'Intake manifold', 'Plenum with integrated air-to-water intercooler feeding six short runners.', 'Distributes charge air evenly to each cylinder with minimal volume for sharp throttle response.', 'PA6-GF35 plastic, aluminium intercooler core', 'Volume 3.2 l · runner length 110 mm', 'Charge-cooler leaks let coolant into the intake: look for steam at cold start.', 1650, ['intake'])
p('engine.throttle', 'Throttle body', 'Electronic 82 mm butterfly at the plenum inlet.', 'Meters air into the plenum on command from the ECU; no cable to the pedal.', 'Aluminium body, brass butterfly', 'Bore 82 mm · full travel in 100 ms', 'Carbon build-up around the plate causes idle hunting; clean, do not scrape.', 380)
p('engine.fuelrail', 'Fuel rail', 'High-pressure rail feeding the six direct injectors.', 'Holds a reservoir of petrol at up to 350 bar so each injector sees stable pressure.', 'Forged stainless steel', 'Operating pressure 200–350 bar · volume 45 ml', 'Never crack a fitting with residual pressure; the ECU bleeds the rail on shutdown.', 520)
p('engine.injectors', 'Fuel injectors', 'Six solenoid direct injectors spraying into the cylinder.', 'Deliver precisely metered fuel in up to three pulses per cycle.', 'Stainless steel body, PTFE combustion seal', 'Flow 1,100 cc/min at 350 bar · 6-hole nozzle', 'Combustion seals must be replaced every time an injector is removed.', 1500)
for (let i = 1; i <= 6; i++) p(`engine.injectors.i${i}`, `Injector ${i}`, `Direct injector for cylinder ${i}.`, 'Sprays fuel into the combustion chamber during intake and compression.', 'Stainless steel', '350 bar · 6-hole', 'Replace the PTFE seal on every removal.', 250)
p('engine.sparkplugs', 'Spark plugs', 'Six iridium-tipped plugs, one per cylinder.', 'Ignite the mixture; the fine electrode keeps voltage demand low under boost.', 'Iridium centre electrode, nickel ground', 'Gap 0.7 mm · heat range 7 · torque 23 Nm', 'Change every 60,000 km, sooner with track use; misfire under boost is the classic symptom.', 170)
for (let i = 1; i <= 6; i++) p(`engine.sparkplugs.p${i}`, `Spark plug ${i}`, `Spark plug for cylinder ${i}.`, 'Provides the ignition spark.', 'Iridium', 'Gap 0.7 mm', 'Replace in sets.', 28)
p('engine.coils', 'Ignition coils', 'Coil-on-plug pencil coils driven directly by the ECU.', 'Step 12 V up to ~35 kV to fire each plug.', 'Epoxy-potted copper windings', 'Dwell 2.5 ms · 35 kV', 'A coil failure gives a single-cylinder misfire; swap coils to diagnose.', 480)
for (let i = 1; i <= 6; i++) p(`engine.coils.c${i}`, `Ignition coil ${i}`, `Pencil coil for cylinder ${i}.`, 'Generates the high-voltage pulse.', 'Epoxy-potted copper', '35 kV', 'Swap positions to confirm a suspect coil.', 80)
p('engine.turbo', 'Turbochargers', 'Two mono-scroll turbos, each fed by three cylinders.', 'Compress intake air to about 2.3 bar absolute for 543 hp from 3 litres.', 'Inconel turbine, aluminium compressor wheel', 'Max 190,000 rpm · 50 mm compressor · 2.3 bar', 'Blue smoke on overrun means turbo seals; check oil feed banjo bolts first.', 2900)
p('engine.turbo.t1', 'Turbo 1 (cyl 1–3)', 'Front turbocharger.', 'Boosts cylinders 1–3.', 'Inconel / aluminium', '190,000 rpm', 'Listen for a siren note from a failing bearing.', 1450)
p('engine.turbo.t1.compressor', 'Compressor wheel', 'Milled aluminium impeller on the intake side.', 'Draws in and compresses fresh air.', 'Machined 2618 aluminium', '50 mm inducer · 11 blades', 'Damage from ingested debris; always check the intake filter seals.', 350)
p('engine.turbo.t1.turbine', 'Turbine wheel', 'Exhaust-driven wheel that spins the shaft.', 'Extracts energy from the exhaust gas to drive the compressor.', 'Inconel 713', '45 mm · 950 °C max inlet', 'Blade cracks appear after repeated overheating.', 420)
p('engine.turbo.t1.wastegate', 'Wastegate', 'Electrically actuated flap in the turbine housing.', 'Bypasses exhaust around the turbine to cap boost.', 'Stainless flap, electric actuator', 'Actuator travel 12 mm · 0–100 % in 120 ms', 'Rattle at idle is a worn flap pivot; the actuator is recalibrated with a scan tool.', 380)
p('engine.turbo.t2', 'Turbo 2 (cyl 4–6)', 'Rear turbocharger.', 'Boosts cylinders 4–6.', 'Inconel / aluminium', '190,000 rpm', 'Same service life as turbo 1; they are usually replaced as a pair.', 1450)
p('engine.turbo.t2.compressor', 'Compressor wheel', 'Milled aluminium impeller.', 'Compresses fresh air.', '2618 aluminium', '50 mm inducer', 'Debris damage.', 350)
p('engine.turbo.t2.turbine', 'Turbine wheel', 'Exhaust-driven wheel.', 'Drives the compressor.', 'Inconel 713', '45 mm', 'Heat cracking.', 420)
p('engine.turbo.t2.wastegate', 'Wastegate', 'Electric wastegate flap.', 'Limits boost.', 'Stainless / electric actuator', '12 mm travel', 'Pivot wear rattle.', 380)
p('engine.exmanifold', 'Exhaust manifold', 'Two three-into-one cast manifolds integrated with the turbine housings.', 'Collects exhaust from each bank of three cylinders and directs it into the turbine.', 'Cast heat-resistant steel (1.4837)', 'Runner 38 mm · 980 °C max', 'Cracks between runners after track abuse; listen for ticking on cold start.', 1100)
p('engine.alternator', 'Alternator', 'Belt-driven generator with clutch pulley.', 'Recharges the battery and powers the electrical system.', 'Copper windings, aluminium housing', '210 A · 14.2 V regulated', 'One-way clutch pulley wears first: growl at idle that vanishes when the belt is off.', 690)
p('engine.starter', 'Starter motor', 'Reduction-gear starter bolted to the bell housing.', 'Cranks the engine to about 250 rpm for starting.', 'Steel gears, copper armature', '2.2 kW · 12 V', 'Solenoid contacts pit; symptom is a click without cranking.', 410)
p('engine.belt', 'Belt drive', 'Serpentine belt with tensioner and idler.', 'Drives alternator, water pump and A/C compressor from the crank pulley.', 'EPDM 6-rib belt, steel/plastic pulleys', 'Belt 6PK 1,650 mm · tension 400 N', 'Belt is replaced at 100,000 km with the tensioner; check for glazing.', 260)
p('engine.belt.serpentine', 'Serpentine belt', 'Six-rib poly-V belt.', 'Transmits crank torque to the accessories.', 'EPDM rubber with polyester cords', '6PK 1,650', 'Replace at 100,000 km.', 45)
p('engine.belt.crankpulley', 'Crank pulley', 'Harmonic damper on the crank nose.', 'Drives the belt and damps torsional vibration.', 'Steel with bonded rubber ring', '160 mm · 8 kg', 'Rubber ring separates with age; the outer ring wobbles.', 290)
p('engine.belt.tensioner', 'Belt tensioner', 'Spring-loaded arm with idler.', 'Keeps belt tension constant as the belt stretches.', 'Steel spring, plastic pulley', '400 N nominal', 'Bearing noise at idle.', 120)
p('engine.belt.altpulley', 'Alternator pulley', 'Overrunning clutch pulley.', 'Lets the alternator rotor freewheel on sudden engine deceleration.', 'Steel, one-way clutch', '55 mm', 'Fails seized or free; belt chirp.', 90)
p('engine.belt.wppulley', 'Water pump pulley', 'Plain steel pulley.', 'Drives the coolant pump.', 'Pressed steel', '110 mm', 'Rarely fails.', 35)
p('engine.mounts', 'Engine mounts', 'Two hydraulic mounts on the block sides.', 'Locate the engine and isolate vibration from the body.', 'Cast aluminium bracket, hydraulic rubber mount', 'Stiffness 350 N/mm · 90 kg load each', 'Leaking hydraulic fluid means a collapsed mount; symptom is driveline clunk.', 360)
p('engine.mounts.left', 'Left engine mount', 'Driver-side hydraulic mount.', 'Supports and isolates the engine.', 'Aluminium / rubber', '350 N/mm', 'Check for fluid leaks.', 180)
p('engine.mounts.right', 'Right engine mount', 'Passenger-side hydraulic mount.', 'Supports and isolates the engine.', 'Aluminium / rubber', '350 N/mm', 'Check for fluid leaks.', 180)
p('engine.crank', 'Crankshaft', 'Forged steel crank with eight counterweights.', 'Converts the pistons\' linear motion into rotation; carries the flywheel and belt drive.', 'Forged 42CrMo4 steel, induction-hardened journals', 'Stroke 90 mm · main journal 60 mm · 7 main bearings · 21 kg', 'Rod-bearing wear shows as a knock under load; bearings are replaced pre-emptively by track owners at ~100,000 km.', 3200)
p('engine.crank.mainbearings', 'Main bearings', 'Seven split plain bearings.', 'Support the crank in the block on an oil film.', 'Tri-metal aluminium/tin on steel backing', 'Clearance 0.03–0.05 mm', 'Copper showing through means replace.', 210)
p('engine.crank.flywheel', 'Flywheel / flexplate', 'Flexplate bolted to the crank flange.', 'Carries the torque converter and the starter ring gear.', 'Stamped steel', '300 mm · 132-tooth ring gear', 'Cracks around the bolt holes after a starter engagement failure.', 260)
p('engine.camshafts', 'Camshafts', 'Two hollow camshafts with VANOS phasers.', 'Open the valves with a profile matched to the turbo; phasing shifts up to 60° for torque or economy.', 'Composite camshaft: steel lobes on a steel tube', 'Intake lift 9.9 mm · exhaust 9.0 mm · VANOS range 60°', 'VANOS rattle on cold start points at worn phaser lock pins.', 1900)
p('engine.camshafts.intake', 'Intake camshaft', 'Cam operating the 12 intake valves.', 'Times intake valve opening.', 'Assembled steel', '9.9 mm lift', 'Lobe wear if oil changes are skipped.', 950)
p('engine.camshafts.exhaust', 'Exhaust camshaft', 'Cam operating the 12 exhaust valves.', 'Times exhaust valve opening; drives the high-pressure fuel pump.', 'Assembled steel', '9.0 mm lift', 'Fuel-pump lobe wear.', 950)
p('engine.valves', 'Valves', '24 valves with springs and hydraulic lash adjusters.', 'Admit charge air and release exhaust at the right moment.', 'Intake: steel · exhaust: sodium-filled steel', 'Intake 32 mm · exhaust 28 mm · seat angle 45°', 'Carbon on the intake valves is small thanks to port + direct injection.', 1400)
for (let i = 1; i <= 6; i++) {
  p(`engine.valves.in${i}`, `Intake valves cyl ${i}`, `Pair of intake valves for cylinder ${i}.`, 'Admit charge air.', 'Steel', '32 mm', 'Seat recession is rare.', 60)
  p(`engine.valves.ex${i}`, `Exhaust valves cyl ${i}`, `Pair of sodium-filled exhaust valves for cylinder ${i}.`, 'Release exhaust to the turbo.', 'Sodium-filled steel', '28 mm', 'Check for burnt seats after overheating.', 90)
}
p('engine.springs', 'Valve springs', '24 single conical springs.', 'Close the valves and keep the follower on the cam at 7,200 rpm.', 'Chrome-silicon spring steel', 'Seat load 280 N · open 650 N', 'Spring fatigue lets the valves float; rare below 200,000 km.', 380)
p('engine.timing', 'Timing chain', 'Single roller chain from crank to both cams.', 'Keeps the camshafts in phase with the crank.', 'Roller chain, steel', 'Pitch 8 mm · 150 links · stretch limit 0.5 %', 'Chain rattle on cold start is the tensioner; stretch triggers VANOS fault codes.', 620)
p('engine.timing.chain', 'Chain', 'Single-row roller chain.', 'Transmits crank rotation to the cams.', 'Steel', '150 links', 'Stretch limit 0.5 %.', 180)
p('engine.timing.tensioner', 'Chain tensioner', 'Hydraulic tensioner with ratchet.', 'Keeps the chain taut regardless of wear.', 'Steel piston in aluminium body', 'Stroke 12 mm', 'Replace with the chain.', 140)
p('engine.timing.guides', 'Chain guides', 'Plastic slipper guides.', 'Guide the chain run and damp vibration.', 'PA66 glass-filled', '2 guides + 1 tensioner rail', 'Brittle after 150,000 km; plastic in the sump is the sign.', 120)
p('engine.pistons', 'Pistons', 'Six forged pistons with cooling galleries.', 'Transmit combustion pressure to the crank through the connecting rods.', 'Forged 2618 aluminium, coated skirts', 'Bore 84 mm · compression height 30 mm · 380 g each', 'Ring-land damage from detonation; low-quality fuel is the usual cause.', 2400)
for (let i = 1; i <= 6; i++) {
  p(`engine.pistons.p${i}`, `Piston ${i}`, `Forged piston in cylinder ${i}.`, 'Compresses the charge and takes the combustion load.', 'Forged 2618 aluminium', '84 mm · 380 g', 'Check ring lands after any detonation event.', 320)
  p(`engine.pistons.p${i}.rings`, 'Piston rings', 'Two compression rings and one oil-control ring.', 'Seal combustion gas and scrape oil from the bore.', 'Nitrided steel top ring, cast iron second, 3-piece oil ring', 'End gap 0.30 / 0.45 / 0.25 mm', 'Worn rings show as blow-by and oil consumption.', 60)
  p(`engine.pistons.p${i}.pin`, 'Wrist pin', 'Full-floating gudgeon pin.', 'Links piston and connecting rod.', 'Case-hardened 16MnCr5 steel', '22 mm · 65 mm long', 'Retained by circlips; never reuse clips.', 25)
  p(`engine.pistons.p${i}.rod`, 'Connecting rod', 'Forged I-beam rod with fracture-split cap.', 'Transfers piston force to the crank throw.', 'Forged 36MnVS4 steel', 'Length 144 mm · 520 g', 'Rod bolts are torque-to-yield: single use.', 210)
}
p('engine.sensors', 'Engine sensors', 'Key sensors the ECU reads to run the engine.', 'Provide airflow, mixture and crank position feedback.', 'Various', '—', 'Most engine fault codes trace to one of these three.', 0)
p('engine.sensors.maf', 'Mass airflow sensor', 'Hot-film MAF in the intake duct.', 'Measures the mass of air entering so fuelling can match it.', 'Platinum hot film on ceramic', '0–1,400 kg/h · 5 V output', 'Oil mist from a bad filter skews readings lean; clean with MAF spray only.', 190)
p('engine.sensors.o2', 'Oxygen sensors', 'Wide-band lambda sensor before, narrow-band after each catalyst.', 'Report mixture so the ECU can trim fuel and monitor the cats.', 'Zirconia element, heater', 'Heater 12 W · response 100 ms', 'Slow response after 150,000 km; replace in pairs.', 320)
p('engine.sensors.crank', 'Crank position sensor', 'Hall sensor reading a 60-2 tooth wheel.', 'Tells the ECU crank angle and speed for ignition and injection timing.', 'Hall IC in plastic housing', '60-2 teeth · 0.8 mm air gap', 'Intermittent stall when hot is the classic failure.', 95)

/* ------------------------------------------------------------------ drivetrain */
p('drivetrain', 'Drivetrain', 'Rear-wheel-drive layout with an 8-speed automatic.', 'Carries torque from the crank to the rear wheels.', 'Steel, aluminium, carbon fibre', '8HP76 · 3.15:1 final drive · 650 Nm rated', 'Gearbox oil is “lifetime” by BMW but every 80,000 km for track cars.', 0)
p('drivetrain.converter', 'Torque converter', 'Lock-up torque converter with damper.', 'Multiplies torque at launch, then locks for a solid connection.', 'Stamped steel shell, friction lock-up clutch', 'Stall 2,400 rpm · lock-up from 2nd gear', 'Shudder under light throttle at 1,500 rpm is the lock-up clutch.', 1400)
p('drivetrain.gearbox', 'Gearbox', 'ZF 8HP76 eight-speed automatic with M Drivelogic.', 'Selects one of eight ratios and shifts in under 150 ms.', 'Aluminium housing, steel gear sets', 'Ratios 5.0–0.64 · 9 l oil · 100 kg', 'Mechatronic sleeve seal leak drops pressure; symptom is harsh shifting when hot.', 8900, 'transmission')
p('drivetrain.gearbox.housing', 'Housing', 'Die-cast aluminium case.', 'Contains the gear sets and holds 9 l of ATF.', 'Die-cast AlSi9Cu3', '100 kg assembly', 'Oil pan gasket seep.', 1200, 'transmission')
p('drivetrain.gearbox.gearsets', 'Planetary gear sets', 'Four planetary sets giving eight forward ratios.', 'Combine to produce each gear ratio with only five shift elements.', 'Case-hardened steel', '4 planetary sets · 5 clutches/brakes', 'Sun gear spline wear after repeated launch control.', 2600)
p('drivetrain.gearbox.gearsets.g1', 'Gear set 1', 'Input planetary set.', 'First stage of ratio multiplication.', 'Case-hardened steel', '', 'Inspect at rebuild.', 650)
p('drivetrain.gearbox.gearsets.g2', 'Gear set 2', 'Second planetary set.', 'Ratio multiplication.', 'Case-hardened steel', '', 'Inspect at rebuild.', 650)
p('drivetrain.gearbox.gearsets.g3', 'Gear set 3', 'Third planetary set.', 'Ratio multiplication.', 'Case-hardened steel', '', 'Inspect at rebuild.', 650)
p('drivetrain.gearbox.gearsets.g4', 'Gear set 4', 'Output planetary set.', 'Final stage before the output shaft.', 'Case-hardened steel', '', 'Inspect at rebuild.', 650)
p('drivetrain.gearbox.shafts', 'Shafts', 'Input and output shafts.', 'Carry torque in and out of the gear sets.', 'Nitrided steel', 'Input spline 40 mm', 'Spline fretting.', 900)
p('drivetrain.gearbox.synchros', 'Shift elements', 'Multi-plate clutches and brakes (the automatic\'s equivalent of synchros).', 'Engage and release gear-set members to change ratio.', 'Sintered friction plates on steel', '5 elements · 150 ms shift', 'Friction material wears with heat; fluid turns dark.', 1800)
p('drivetrain.driveshaft', 'Driveshaft', 'Carbon-fibre propshaft to the differential.', 'Transmits torque from the gearbox to the rear axle.', 'CFRP tube with steel flanges', '1,450 mm · 2.9 kg · 6,500 rpm max', 'Centre bearing wear causes a hum at 90 km/h.', 1900, 'driveshaft_R')
p('drivetrain.driveshaft.ujoint_f', 'Front U-joint', 'Flexible disc coupling at the gearbox end.', 'Absorbs angular misalignment and driveline shock.', 'Rubber/fabric flex disc, steel flanges', '3-bolt · 110 mm', 'Cracked rubber gives clunk on throttle transitions.', 210)
p('drivetrain.driveshaft.ujoint_r', 'Rear U-joint', 'CV joint at the differential end.', 'Allows the shaft to run at a slight angle.', 'Steel, grease packed', '100 mm', 'Torn boot lets grease out.', 240)
p('drivetrain.diff', 'Active M differential', 'Electronically controlled limited-slip differential.', 'Splits torque between rear wheels; locks up to 100 % on demand.', 'Aluminium housing, steel gears, multi-plate clutch', '3.15:1 · 0–100 % lock in 150 ms · 1.5 l oil', 'Oil change every 50,000 km; whine on overrun means ring and pinion.', 4200, 'diff')
p('drivetrain.diff.housing', 'Differential housing', 'Finned aluminium case.', 'Carries the gears and doubles as an oil cooler.', 'Cast aluminium', '1.5 l oil', 'Output-shaft seals leak.', 900, 'diff')
p('drivetrain.diff.ringgear', 'Ring gear', 'Hypoid crown wheel.', 'Turns the drive 90° and provides the final reduction.', 'Case-hardened 20MnCr5', '3.15:1 · 210 mm', 'Pitting after oil starvation.', 780)
p('drivetrain.diff.pinion', 'Pinion', 'Hypoid drive pinion.', 'Drives the ring gear from the propshaft.', 'Case-hardened 20MnCr5', '13 teeth', 'Bearing preload loss causes whine.', 520)
p('drivetrain.diff.spider', 'Spider gears', 'Two spider and two side gears in the carrier.', 'Let the rear wheels turn at different speeds in corners.', 'Forged steel', '4 gears', 'Wear from repeated one-wheel spin.', 340)
p('drivetrain.axles', 'Rear axles', 'Two half-shafts with CV joints.', 'Deliver torque from the differential to each rear hub.', 'Induction-hardened steel', '30 mm · 2 × CV joints each', 'Torn CV boots are the usual repair; click on turns means worn joints.', 1100, 'halfshaft_R')
p('drivetrain.axles.left', 'Left half-shaft', 'Driver-side half-shaft.', 'Drives the left rear wheel.', 'Steel', '30 mm', 'Boot inspection at every service.', 550)
p('drivetrain.axles.right', 'Right half-shaft', 'Passenger-side half-shaft.', 'Drives the right rear wheel.', 'Steel', '30 mm', 'Boot inspection at every service.', 550)
p('drivetrain.axles.cv', 'CV joints', 'Rzeppa joints at each end of each shaft.', 'Transmit torque through suspension travel.', 'Steel balls and cage', '4 joints', 'Replace the boot before the joint fails.', 320)

/* ------------------------------------------------------------------ wheels */
p('wheels', 'Wheel assemblies', 'Four corners: forged wheel, tire, hub and M Carbon-ceramic brake.', 'Put the power down, steer and stop the car.', 'Forged aluminium, rubber, carbon-ceramic, steel', 'F 275/35 ZR19 on 9.5J · R 285/30 ZR20 on 10.5J', 'Torque lug bolts to 140 Nm; recheck after 50 km.', 0)
const CORNERS: [string, string][] = [['fl', 'Front left'], ['fr', 'Front right'], ['rl', 'Rear left'], ['rr', 'Rear right']]
for (const [c, nm] of CORNERS) {
  const front = c[0] === 'f'
  const w = `wheels.${c}`
  p(w, `${nm} wheel`, `${nm} wheel, tire and brake assembly.`, front ? 'Steers and provides most of the braking.' : 'Puts the power down and carries the rear brake.', 'Forged aluminium, rubber, carbon-ceramic', front ? '19 × 9.5J · 275/35 · 400 mm disc' : '20 × 10.5J · 285/30 · 380 mm disc', 'Check tire pressure cold: 2.4 bar front, 2.6 bar rear.', 0)
  p(`${w}.tire`, 'Tire', front ? 'Michelin Pilot Sport Cup 2 R, 275/35 ZR19.' : 'Michelin Pilot Sport Cup 2 R, 285/30 ZR20.', 'The only contact with the road: grip, ride and steering feel.', 'Silica-compound rubber, polyester/steel carcass', front ? '275/35 ZR19 · 11 kg · 2.4 bar' : '285/30 ZR20 · 12 kg · 2.6 bar', 'Cup 2 R lasts ~5,000 km of road use; replace at 1.6 mm, sooner in the wet.', front ? 520 : 560)
  p(`${w}.tire.tread`, 'Tread', 'Shallow-groove semi-slick tread.', 'Provides dry grip and clears water through four grooves.', 'Soft silica compound', 'New depth 5 mm · 3 % void', 'Wears fast on the outer shoulder if camber is street-spec.', 0)
  p(`${w}.tire.sidewall`, 'Sidewall', 'Stiff, short sidewall.', 'Carries the load and controls flex under cornering.', 'Rubber over polyester cords', 'Aspect ratio 35 % · 2 plies', 'Bulges after pothole hits mean an internal cord break: replace.', 0)
  p(`${w}.tire.bead`, 'Bead', 'Steel-wire hoop at the tire edge.', 'Locks the tire to the rim under pressure.', 'High-tensile steel wire bundle', 'Seat pressure 3.5 bar', 'Lube beads when mounting to avoid damage.', 0)
  p(`${w}.rim`, 'Forged wheel', front ? 'M forged 19-inch wheel, style 827M.' : 'M forged 20-inch wheel, style 827M.', 'Carries the tire and transmits torque and braking through the hub.', 'Forged 6082 aluminium', front ? '19 × 9.5J ET 20 · 9.8 kg' : '20 × 10.5J ET 34 · 10.9 kg', 'Kerb rash is cosmetic; a bent barrel needs replacement, not straightening.', front ? 1850 : 1950)
  p(`${w}.lugs`, 'Lug bolts', 'Five M14 × 1.25 wheel bolts.', 'Clamp the wheel to the hub.', 'Class 10.9 steel, black zinc', '5 × M14 · 140 Nm', 'Replace bolts with stretched threads; never lubricate.', 40)
  for (let i = 1; i <= 5; i++) p(`${w}.lugs.b${i}`, `Lug bolt ${i}`, 'Wheel bolt.', 'Clamps the wheel.', 'Steel 10.9', 'M14 × 1.25 · 140 Nm', 'Replace if stretched.', 8)
  p(`${w}.hub`, 'Wheel hub', 'Flanged hub the wheel bolts to.', 'Carries the wheel and disc on the bearing.', 'Forged steel', '5 × 112 mm PCD · 66.6 mm bore', 'Rust on the mating face causes wheel vibration: clean at every tire change.', 180)
  p(`${w}.bearing`, 'Wheel bearing', 'Double-row angular-contact ball bearing.', 'Lets the hub spin freely under cornering loads.', 'Bearing steel, sealed', 'Gen 3 flanged unit · 75 mm OD', 'Hum that changes with steering input is the classic failure.', 210)
  p(`${w}.disc`, 'Brake disc', front ? '400 mm M Carbon-ceramic disc.' : '380 mm M Carbon-ceramic disc.', 'Converts kinetic energy to heat when the pads clamp it.', 'Carbon-fibre reinforced silicon carbide, aluminium hat', front ? '400 × 38 mm · 7.6 kg · 1,000 °C capable' : '380 × 28 mm · 6.4 kg', 'Weighed, not measured: replace when 60 g lighter than new. Never bed with the parking brake hot.', front ? 3900 : 3400)
  p(`${w}.caliper`, 'Brake caliper', front ? 'Six-piston fixed caliper.' : 'Single-piston floating caliper with electric parking brake.', 'Pushes the pads against the disc.', 'Cast aluminium, stainless pistons', front ? '6 × 38/34/30 mm pistons' : '1 × 45 mm piston', 'Sticking pistons after winter salt; rebuild with new seals.', front ? 1650 : 980)
  p(`${w}.pads`, 'Brake pads', 'Ceramic-compatible friction pads.', 'Rub the disc to slow the car.', 'Low-metallic organic compound', front ? 'Thickness 17 mm new · min 3 mm' : '15 mm · min 3 mm', 'Wear sensor triggers the dash warning at 3.5 mm.', front ? 480 : 380)
  p(`${w}.piston`, 'Caliper pistons', 'Pistons inside the caliper.', 'Convert hydraulic pressure into clamping force.', 'Stainless steel, titanium heat shields', front ? '6 pistons' : '1 piston', 'Corrosion behind the dust seal seizes them.', 160)
  p(`${w}.brakeline`, 'Brake line', 'Flexible hose to the caliper.', 'Carries brake fluid from the hard line to the moving caliper.', 'PTFE liner, braided stainless', '3.2 mm bore · 250 bar burst', 'Replace at 6 years; a soft pedal with good pads points here.', 60)
  p(`${w}.abs`, 'ABS sensor', 'Active wheel-speed sensor on the hub.', 'Feeds wheel speed to ABS, DSC and the speedometer.', 'Hall IC, magnetic encoder in the bearing seal', '48 pulses/rev', 'Debris on the encoder gives intermittent ABS faults.', 85)
  p(`${w}.valve`, 'Valve stem', 'Metal clamp-in valve.', 'Lets you inflate the tire and seals it.', 'Aluminium, EPDM seal', 'TR416 · 11.3 mm hole', 'Replace the core when it leaks.', 12)
  p(`${w}.tpms`, 'TPMS sensor', 'Tire-pressure sensor on the valve stem.', 'Broadcasts pressure and temperature to the car.', 'Plastic housing, lithium cell', '433 MHz · 7-year battery', 'Battery is not replaceable: the whole sensor is.', 70)
  p(`${w}.cap`, 'Centre cap', 'Roundel cap in the hub bore.', 'Hides the hub and keeps water out.', 'ABS plastic, enamel badge', '68 mm', 'Snaps out with a trim tool.', 25)
}

/* ------------------------------------------------------------------ suspension */
p('suspension', 'Suspension & steering', 'Double-joint strut front, five-link rear, adaptive dampers.', 'Keeps the tires planted and lets the driver point the car.', 'Forged aluminium arms, steel springs, aluminium dampers', 'Front camber −2.0° · rear −1.8° · toe 0.1° in', 'Alignment check after any track day; ball joints at 100,000 km.', 0)
p('suspension.struts', 'Front struts', 'Adaptive M dampers in strut form.', 'Damp spring motion with electronically variable valving.', 'Aluminium tube, steel rod', 'Stroke 140 mm · 3 damping maps', 'Oil weep on the rod means replace in pairs.', 1400, 'strut_F')
p('suspension.shocks', 'Rear shocks', 'Adaptive rear dampers.', 'Damp the rear springs.', 'Aluminium tube', 'Stroke 120 mm', 'Top mount bushings crack.', 1100, 'shock_R')
p('suspension.springs', 'Coil springs', 'Progressive-rate coil springs.', 'Carry the car\'s weight and store bump energy.', 'Chrome-silicon spring steel, epoxy coated', 'Front 55 N/mm · rear 95 N/mm', 'Corroded coating leads to breakage at the bottom coil.', 520)
p('suspension.springs.fl', 'Front left spring', 'Front coil spring.', 'Supports the front left corner.', 'Spring steel', '55 N/mm', 'Inspect coating.', 130)
p('suspension.springs.fr', 'Front right spring', 'Front coil spring.', 'Supports the front right corner.', 'Spring steel', '55 N/mm', 'Inspect coating.', 130)
p('suspension.springs.rear', 'Rear springs', 'Rear coil springs on separate perches.', 'Support the rear.', 'Spring steel', '95 N/mm', 'Inspect coating.', 260, 'spring_R')
p('suspension.arms', 'Control arms', 'Forged aluminium lower arms front, five-link rear.', 'Locate the hub in the geometry the engineers chose.', 'Forged aluminium', 'Front: 2 lower arms per side · rear: 5 links', 'Bushings soften after 80,000 km: vague steering on entry.', 2200)
p('suspension.arms.front_a', 'Front lower arms A', 'Front tension struts.', 'Locate the front hubs fore-aft.', 'Forged aluminium', '', 'Hydro bushing leak.', 560, 'lowerarm_F_a')
p('suspension.arms.front_b', 'Front lower arms B', 'Front lower wishbones.', 'Locate the front hubs laterally.', 'Forged aluminium', '', 'Ball joint play.', 520, 'lowerarm_F_b')
p('suspension.arms.rear_lower', 'Rear lower arms', 'Rear lower control arms carrying the springs.', 'Locate the rear hubs and support spring loads.', 'Forged aluminium', '', 'Bushing wear.', 480, ['lowerarm_R', 'lowerarm_R_a'])
p('suspension.arms.rear_upper', 'Rear upper arms', 'Rear upper links.', 'Control rear camber.', 'Forged aluminium', '', 'Bushing wear.', 420, ['upperarm_R', 'upperarm_R_a'])
p('suspension.balljoints', 'Ball joints', 'Sealed ball joints at each arm-to-knuckle link.', 'Allow the hub to steer and travel while staying located.', 'Hardened steel ball, POM socket', '8 joints · 25 mm ball', 'Clunk over small bumps; the boot goes first.', 480)
p('suspension.balljoints.fl', 'Front left ball joints', 'Two lower ball joints.', 'Locate the left front knuckle.', 'Steel / POM', '25 mm', 'Boot inspection.', 120)
p('suspension.balljoints.fr', 'Front right ball joints', 'Two lower ball joints.', 'Locate the right front knuckle.', 'Steel / POM', '25 mm', 'Boot inspection.', 120)
p('suspension.tierods', 'Tie rods', 'Inner and outer tie rods from the rack.', 'Turn the front wheels when the rack moves.', 'Steel with sealed ball ends', 'Outer joint 20 mm', 'Play in the outer end shows as a wandering wheel on the shaker.', 260, ['tierod_F', 'tierod_R'])
p('suspension.swaybar', 'Anti-roll bars', 'Hollow front and rear stabiliser bars.', 'Resist body roll by linking the two wheels of an axle.', 'Hollow spring steel, 3-position rear', 'Front 28 mm · rear 21 mm', 'End-link ball joints rattle over bumps.', 700, ['swaybar_F', 'swaybar_R'])
p('suspension.swaybar.links', 'End links', 'Four drop links.', 'Connect the bar to the struts and arms.', 'Steel, sealed joints', '4 × 240 mm', 'Rattle over small bumps means replace.', 180, ['swaybar_links_F', 'swaybar_links_R'])
p('suspension.bushings', 'Bushings', 'Rubber and hydraulic bushings in the arms and subframes.', 'Isolate vibration while locating the arms.', 'Natural rubber, some hydraulic', '~24 bushings', 'Cracked bushings give a loose rear under braking.', 640)
p('suspension.bushings.front', 'Front arm bushings', 'Hydraulic tension-strut bushings.', 'Absorb impacts fore-aft.', 'Hydraulic rubber', '2', 'Fluid leak.', 220)
p('suspension.bushings.rear', 'Rear arm bushings', 'Rear link bushings.', 'Locate the rear links.', 'Rubber', '10', 'Crack inspection.', 320)
p('suspension.subframes', 'Subframes', 'Front and rear aluminium subframes.', 'Carry the suspension and drivetrain and bolt to the body.', 'Cast and extruded aluminium', 'Rear subframe rigidly mounted on the CSL', 'Rigid rear mounts transmit more noise but never wear.', 2600, ['subframe_F', 'subframe_R'])
p('suspension.rack', 'Steering rack', 'Electric power steering rack, variable ratio.', 'Turns steering-wheel motion into tie-rod travel with electric assist.', 'Aluminium housing, steel rack', 'Ratio 14.6–11.0:1 · 2.2 turns lock-to-lock', 'Clunk over bumps is rack bushings; motor failure is rare.', 2400, 'steeringbox')
p('suspension.column', 'Steering column', 'Collapsible column with electric adjust.', 'Connects the wheel to the rack through a universal joint.', 'Steel shafts, aluminium housing', 'Reach 40 mm · rake 4°', 'U-joint wear gives a notchy feel around centre.', 900)

/* ------------------------------------------------------------------ cooling */
p('cooling', 'Cooling system', 'Twin-circuit cooling: high temperature for the engine, low temperature for charge air.', 'Keeps engine, turbos and charge air at target temperatures under track load.', 'Aluminium cores, plastic tanks, EPDM hoses', 'Capacity 12 l · 1.4 bar cap', 'Coolant change every 4 years; BMW blue G48-type.', 0)
p('cooling.radiator', 'Radiator', 'Aluminium crossflow radiator behind the grille.', 'Rejects engine heat to the airstream.', 'Brazed aluminium core, plastic tanks', '600 × 420 × 32 mm · 45 kW rejection', 'Plastic tank cracks at the seam after 10 years.', 720, 'radiator')
p('cooling.fans', 'Cooling fans', 'Two electric fans on the radiator.', 'Pull air through the radiator when road speed is low.', 'PA66 blades, brushless motors', '850 W total · 5 speeds', 'Bearing whine at low speed; fans run on after hot shutdown by design.', 620)
p('cooling.fans.left', 'Left fan', 'Left electric fan.', 'Pulls air through the radiator.', 'PA66 / brushless motor', '400 W', 'Bearing whine.', 310)
p('cooling.fans.right', 'Right fan', 'Right electric fan.', 'Pulls air through the radiator.', 'PA66 / brushless motor', '450 W', 'Bearing whine.', 310)
p('cooling.hoses', 'Coolant hoses', 'Upper and lower radiator hoses plus the turbo feed lines.', 'Carry coolant between engine, radiator and expansion tank.', 'EPDM with aramid reinforcement', 'Upper 38 mm · lower 38 mm', 'Squeeze test: soft or crunchy hoses are due.', 260)
p('cooling.hoses.upper', 'Upper hose', 'Engine outlet to radiator.', 'Carries hot coolant to the radiator.', 'EPDM', '38 mm', 'Replace with the thermostat.', 90)
p('cooling.hoses.lower', 'Lower hose', 'Radiator to water pump.', 'Returns cooled coolant.', 'EPDM', '38 mm', 'Check the clamp.', 90)
p('cooling.tank', 'Expansion tank', 'Pressurised coolant reservoir with level sensor.', 'Gives coolant room to expand and holds system pressure.', 'PA66 plastic', '1.4 bar cap · 1.2 l', 'Hairline cracks after 8 years; replace on the first sign of weeping.', 150)
p('cooling.oilcooler', 'Oil coolers', 'Engine and transmission oil-to-air coolers in the front apron.', 'Keep oil below 130 °C on track.', 'Brazed aluminium', 'Engine 300 × 200 mm · trans 250 × 150 mm', 'Stone damage to the fins; screen them for track use.', 640)
p('cooling.intercooler', 'Charge-air cooler', 'Low-temperature radiator for the intake charge cooler.', 'Removes the heat the turbos add to the intake air.', 'Aluminium core', '400 × 300 mm · 40 °C charge temp target', 'Dedicated electric pump; failure shows as heat soak after two laps.', 540, 'intercooler')

/* ------------------------------------------------------------------ fuel */
p('fuel', 'Fuel system', 'Saddle tank under the rear seat with an in-tank pump and high-pressure engine pump.', 'Stores and delivers 98 RON petrol to the injectors.', 'HDPE tank, stainless lines', '59 l tank · 6 bar low / 350 bar high pressure', 'Fuel filter is lifetime in the tank; use 98 RON or the ECU pulls timing.', 0, 'fueltank')
p('fuel.tank', 'Fuel tank', 'Blow-moulded saddle tank.', 'Holds 59 litres over the rear axle.', 'Multi-layer HDPE with EVOH barrier', '59 l · 12 kg', 'Straps corrode; tank itself lasts the life of the car.', 980, 'fueltank')
p('fuel.pump', 'Fuel pumps', 'In-tank low-pressure pump plus cam-driven high-pressure pump.', 'Lift fuel to the rail at up to 350 bar.', 'Brushless in-tank pump, steel HPFP', 'LP 6 bar 200 l/h · HP 350 bar', 'HPFP roller follower wear on early S58s; listen for a tick at the cam cover.', 1300)
p('fuel.lines', 'Fuel lines', 'Underbody supply line and engine-bay high-pressure lines.', 'Carry fuel from tank to engine.', 'Stainless steel, plastic-coated', '8 mm supply', 'Check clips and chafe points under the car.', 240)
p('fuel.filter', 'Fuel filter', 'In-tank filter on the pump module.', 'Keeps particles out of the injectors.', 'Paper element in plastic housing', '10 µm', 'Lifetime part; replaced with the pump module.', 90)
p('fuel.filler', 'Filler neck', 'Filler pipe from the flap to the tank.', 'Guides fuel into the tank and vents vapour to the charcoal canister.', 'Stainless steel, rubber joint', '45 mm · capless', 'Capless seal sticks; a fuel smell after filling is the vent valve.', 210)

/* ------------------------------------------------------------------ exhaust */
p('exhaust', 'Exhaust system', 'Twin downpipes, catalysts, resonator and a titanium rear silencer with flaps.', 'Carries exhaust gas out, cleans it and shapes the sound.', 'Stainless steel, titanium silencer', 'Twin 65 mm · 4 × 100 mm tips · 15 kg', 'Flap actuators fail in the open position; tips discolour with heat.', 4400, 'exhaust')
p('exhaust.downpipe', 'Downpipes', 'Two downpipes from the turbine housings.', 'Take gas from the turbos to the catalysts.', 'Stainless 1.4509', '65 mm · 1.2 mm wall', 'Flex-joint braid frays after 100,000 km.', 620)
p('exhaust.cat', 'Catalytic converters', 'Close-coupled three-way catalysts plus GPF.', 'Convert CO, HC and NOx; the particulate filter traps soot.', 'Ceramic substrate, platinum/palladium/rhodium wash-coat', '2 × 1.5 l · 600 cpsi · light-off 300 °C', 'Rattle means a broken substrate; GPF regenerates on long drives.', 3200)
p('exhaust.resonator', 'Resonator', 'Centre resonator under the driveshaft.', 'Cancels drone at cruising rpm.', 'Stainless steel', '4 l · 1,800 rpm tuned', 'Rarely fails; internal baffle rattle when old.', 480)
p('exhaust.muffler', 'Rear silencer', 'Titanium rear muffler with two electrically controlled flaps.', 'Reduces noise to the legal limit and opens up in M mode.', 'Grade 2 titanium', '9 kg · flaps open above 3,500 rpm in Sport+', 'Flap actuator motor fails: stuck quiet or stuck loud.', 2600)
p('exhaust.tips', 'Tailpipes', 'Four 100 mm titanium tips.', 'Finish the exhaust and set the sound signature.', 'Titanium', '4 × 100 mm', 'Heat tint is normal; polish only with titanium-safe compound.', 360, 'exhaust_double_straight')

/* ------------------------------------------------------------------ electrical */
p('electrical', 'Electrical system', '12 V system with a trunk-mounted AGM battery and ~40 control units.', 'Powers, controls and lights everything.', 'Copper harness, PA housings', '12 V · 90 Ah · 210 A alternator', 'Register a new battery with a scan tool or the charging strategy stays wrong.', 0)
p('electrical.battery', 'Battery', 'AGM battery, trunk-mounted on the road car.', 'Starts the engine and buffers the 12 V system.', 'Lead-acid AGM', '12 V · 90 Ah · 900 CCA · 25 kg', 'Replace at 5–6 years; short trips kill AGM batteries.', 320, 'battery')
p('electrical.fusebox', 'Fuse box', 'Front power distribution box.', 'Protects circuits with fuses and relays.', 'PA66 housing, tin-plated copper', '45 fuses · 8 relays', 'Water ingress corrodes the terminals if the cover seal fails.', 280)
p('electrical.ecu', 'Engine ECU (DME)', 'Bosch MG1 engine controller.', 'Runs fuel, ignition, boost and VANOS 1,000 times per second.', 'Aluminium housing, multilayer PCB', '2 × 300 MHz cores · 4 MB flash', 'Software updates fix most drivability quirks; hardware failure is rare.', 1900)
p('electrical.harness', 'Wiring harness', 'Engine-bay harness.', 'Connects sensors, actuators and the ECU.', 'PVC/XLPE copper wire, PA convolute', '~180 m of wire in the engine bay alone', 'Chafe at the cam-cover edge; rodent damage on garaged cars.', 2200)
p('electrical.headlights', 'Headlights', 'Adaptive LED headlights with the CSL yellow daytime signature.', 'Light the road and signal the car\'s presence.', 'PC lens, PPS housing, LED modules', 'High beam 500 m · yellow DRL', 'Condensation after a lens crack; the whole unit is replaced.', 3400)
p('electrical.headlights.left', 'Left headlight', 'Driver-side unit.', 'Lights the road.', 'PC / PPS', '', 'Check lens seal.', 1700, 'headlight_L_yellow')
p('electrical.headlights.left.housing', 'Housing', 'Black PPS housing.', 'Carries the modules and seals the unit.', 'PPS plastic', '', 'Mounting tabs break in front-end knocks.', 400)
p('electrical.headlights.left.lens', 'Lens', 'Clear polycarbonate lens.', 'Protects the modules and shapes the light.', 'Hard-coated polycarbonate', '', 'Yellowing after 10 years without hard-coat.', 300, 'headlightglass_L')
p('electrical.headlights.left.led', 'LED module', 'Adaptive matrix LED module.', 'Produces low and high beam with selective dimming.', 'LED chips on aluminium heatsink', '2 × 25 W · 5,500 K', 'Fan-cooled; a failed fan throttles the light.', 900)
p('electrical.headlights.right', 'Right headlight', 'Passenger-side unit.', 'Lights the road.', 'PC / PPS', '', 'Check lens seal.', 1700, 'headlight_R_yellow')
p('electrical.headlights.right.housing', 'Housing', 'Black PPS housing.', 'Carries the modules.', 'PPS', '', 'Tab breakage.', 400)
p('electrical.headlights.right.lens', 'Lens', 'Polycarbonate lens.', 'Protects the modules.', 'Polycarbonate', '', 'Yellowing.', 300, 'headlightglass_R')
p('electrical.headlights.right.led', 'LED module', 'Matrix LED module.', 'Produces the beams.', 'LED on aluminium', '2 × 25 W', 'Fan failure.', 900)
p('electrical.taillights', 'Taillights', 'CSL laser taillights with threaded light signature.', 'Tail, brake and indicator functions.', 'PMMA lens, laser diodes and LEDs', 'Laser red module · 90 lm', 'Lens micro-cracks around the fixings.', 2600, ['taillight_L_csl', 'taillight_R_csl', 'tailgatelight_csl'])
p('electrical.taillights.left', 'Left taillight', 'Driver-side cluster.', 'Tail/brake/indicator.', 'PMMA / laser', '', 'Seal check.', 1300, 'taillight_L_csl')
p('electrical.taillights.right', 'Right taillight', 'Passenger-side cluster.', 'Tail/brake/indicator.', 'PMMA / laser', '', 'Seal check.', 1300, 'taillight_R_csl')
p('electrical.horn', 'Horn', 'Twin-tone electric horns behind the bumper.', 'Warns other road users.', 'Steel diaphragm, copper coil', '110 dB · 400/500 Hz', 'Corroded terminals; check the relay first.', 90)
p('electrical.sensors', 'Driver assistance sensors', 'Front camera, front radar and parking sensors.', 'Feed collision warning, lane keeping and parking aids.', 'Various', 'Camera 8 MP · radar 77 GHz · 12 ultrasonic', 'Windscreen replacement needs camera recalibration.', 2400)
p('electrical.sensors.camera', 'Front camera', 'Windscreen-mounted camera behind the mirror.', 'Reads lanes, signs and traffic.', 'CMOS sensor, aluminium bracket', '8 MP · 120°', 'Recalibrate after glass replacement.', 1100)
p('electrical.sensors.radar', 'Front radar', 'Radar sensor in the lower grille.', 'Measures distance to the car ahead.', 'Radome plastic, PCB', '77 GHz · 200 m', 'Misaligned after a bumper knock.', 900)
p('electrical.sensors.parking', 'Parking sensors', 'Ultrasonic sensors in both bumpers.', 'Measure distance to obstacles when parking.', 'Piezo transducer, painted cap', '12 sensors · 2.5 m range', 'Paint build-up deafens them; a constant beep means one has failed.', 400)

/* ------------------------------------------------------------------ body */
p('body', 'Body', 'Exterior panels and glass.', 'Provides the shape, aero and crash structure around the occupants.', 'Steel, aluminium, CFRP', 'Cd 0.34 · frontal area 2.2 m²', 'Wash CFRP with pH-neutral soap; clear-coat matt paint needs no polish.', 0, 'body')
p('body.hood', 'Hood', 'CFRP hood with exposed-weave centre.', 'Covers the engine bay and channels hot air out through the vents.', 'Carbon-fibre reinforced plastic', '1.3 m² · 6.5 kg (vs 13 kg aluminium)', 'CFRP does not dent, it cracks: any impact needs inspection.', 4800, 'hood_csl')
p('body.hood.hinges', 'Hood hinges', 'Twin gooseneck hinges.', 'Let the hood swing open on gas struts.', 'Stamped steel', '2 hinges · 2 gas struts 350 N', 'Gas struts weaken: hood drops slowly.', 160)
p('body.hood.latch', 'Hood latch', 'Twin-latch system with cable release.', 'Holds the hood closed at 300 km/h.', 'Steel, plastic release', '2 latches', 'Lubricate the cable; a stiff release cable frays.', 110)
p('body.trunk', 'Trunk lid', 'CFRP trunk lid with integrated ducktail spoiler.', 'Closes the luggage bay and generates rear downforce.', 'CFRP', '4.2 kg', 'Spoiler edge chips from luggage.', 3900, 'trunk_csl')
p('body.trunk.spoiler', 'Ducktail spoiler', 'Integrated CSL spoiler lip.', 'Adds rear downforce and reduces lift.', 'CFRP', '+45 kg downforce at 250 km/h', 'Cosmetic chips only.', 0)
p('body.trunk.hinges', 'Trunk hinges', 'Gooseneck hinges with gas struts.', 'Swing the lid open.', 'Steel', '2', 'Struts weaken.', 140)
p('body.doors', 'Doors', 'Two frameless aluminium doors.', 'Give access and protect in side impacts.', 'Aluminium skin, aluminium inner, steel beam', '38 kg each', 'Frameless glass needs regular seal treatment.', 0)
for (const [c, nm] of [['left', 'Driver door'], ['right', 'Passenger door']] as const) {
  const side = c === 'left' ? 'FL' : 'FR'
  p(`body.doors.${c}`, nm, `${nm} assembly.`, 'Access and side-impact protection.', 'Aluminium', '38 kg', 'Check hinge sag.', 3200, `door_${side}`)
  p(`body.doors.${c}.skin`, 'Outer skin', 'Aluminium outer panel.', 'Gives the door its shape.', 'Aluminium 6016 · 1.0 mm', '', 'Dents repairable by PDR.', 1400, `door_${side}`)
  p(`body.doors.${c}.inner`, 'Inner panel', 'Structural inner door with side-impact beam.', 'Carries the hinges, latch, glass and speaker.', 'Aluminium, high-strength steel beam', '', 'Water drains clog: carpet gets wet.', 900)
  p(`body.doors.${c}.regulator`, 'Window regulator', 'Cable regulator with motor.', 'Raises and drops the frameless glass, dipping it when the door opens.', 'Steel cable, plastic slider, DC motor', 'Drop 8 mm on door open', 'Cable frays: glass drops into the door.', 260)
  p(`body.doors.${c}.latch`, 'Door latch', 'Soft-close electric latch.', 'Holds the door shut and pulls it closed the last 6 mm.', 'Steel, plastic housing', 'Soft-close motor', 'Soft-close motor fails first.', 340)
  p(`body.doors.${c}.hinges`, 'Door hinges', 'Two forged hinges with check strap.', 'Carry the door.', 'Forged steel', '2', 'Check-strap groan: lubricate.', 120)
  p(`body.doors.${c}.mirror`, 'Door mirror', 'Folding heated mirror with camera.', 'Rear view, blind-spot indicator and surround camera.', 'PA housing, glass', 'Auto-fold · heated · BSD', 'Fold motor grinding.', 780, `mirror_${c === 'left' ? 'L' : 'R'}`)
  p(`body.doors.${c}.glass`, 'Door glass', 'Frameless tempered side glass.', 'Window.', 'Tempered glass 4 mm', '', 'Seal treatment.', 320, `doorglass_${side}`)
}
p('body.fenders', 'Front fenders', 'Aluminium fenders with functional vents.', 'Cover the front wheels and vent wheel-well pressure.', 'Aluminium', '', 'Vent grille clips break.', 1300, ['fender_L', 'fender_R'])
p('body.bumpers', 'Bumpers', 'Front and rear bumper covers with CFRP inserts.', 'Absorb low-speed impacts and manage airflow.', 'PP/EPDM cover, CFRP splitter and diffuser', '', 'Splitter scrapes on kerbs: replaceable lip.', 0)
p('body.bumpers.front', 'Front bumper', 'Front apron with kidney grille and splitter.', 'Feeds air to the coolers and adds front downforce.', 'PP/EPDM, CFRP splitter', '', 'Radar bracket alignment after knocks.', 2100, ['bumper_F', 'splitter_F_csl'])
p('body.bumpers.rear', 'Rear bumper', 'Rear apron with CFRP diffuser.', 'Cleans up airflow under the car.', 'PP/EPDM, CFRP diffuser', '', 'Diffuser fins chip.', 1900, ['bumper_R', 'diffuser', 'diffuserline_csl', 'bumperline_R_csl'])
p('body.roof', 'Roof', 'Exposed-weave CFRP roof panel.', 'Lowers the centre of gravity by 6 kg versus steel.', 'CFRP', '6 kg', 'UV clear-coat fades: keep waxed.', 3200, ['roof_carbon', 'roofline_csl'])
p('body.pillars', 'Pillars', 'A, B and C pillars.', 'Carry the roof and form the safety cell around the glass.', 'Hot-formed boron steel', 'A-pillar 1,500 MPa', 'Never straighten: replace after a rollover.', 0)
p('body.windshield', 'Windshield', 'Laminated acoustic windshield.', 'Keeps the wind out and carries the camera and HUD.', 'Laminated glass with PVB acoustic layer', '5.1 mm · heated wiper park', 'Camera recalibration on replacement.', 1400, 'windshield')
p('body.glass', 'Rear & side glass', 'Rear screen and quarter windows.', 'Visibility and cabin sealing.', 'Tempered glass', '', 'Rear demister lines break.', 900, ['backlight', 'sideglass_L', 'sideglass_R'])
p('body.wipers', 'Wipers', 'Two flat-blade wipers with washer jets on the arms.', 'Clear the windshield.', 'Steel arms, rubber blades', '650 / 480 mm', 'Blades every 12 months.', 190)
p('body.wipers.blades', 'Wiper blades', 'Aero flat blades.', 'Wipe the glass.', 'Rubber, spring steel', '650 / 480 mm', 'Replace yearly.', 60)
p('body.wipers.motor', 'Wiper motor', 'Reversing wiper motor.', 'Drives the arms.', 'DC motor, gear drive', '90 W', 'Park position drifts.', 250)
p('body.grille', 'Kidney grille', 'Frameless CSL kidney grille with red outline.', 'Feeds air to the radiator; the CSL grille is unframed and lighter.', 'ABS, red accent', '', 'Mesh damage from stones.', 1100, ['grille_F_csl', 'grille_F_csl001'])
p('body.badges', 'Badges', 'Roundels and CSL badging.', 'Identify the car.', 'Enamel on aluminium', '', 'Roundel enamel cracks.', 120, ['bumper_F_M4xNME_Badge_0', 'grille_F_csl_M4xNME_badge_csl_0', 'trunk_csl_M4xNME_Badge_0'])
p('body.underbody', 'Underbody panels', 'Flat undertray and wheel-well liners.', 'Smooth airflow under the car and protect the mechanicals.', 'PP, aluminium undertray', '', 'Fixings lost after lifting the car.', 480, ['undertray', 'tubs', 'fenderint'])

/* ------------------------------------------------------------------ interior */
p('interior', 'Interior', 'Two-seat cabin with M Carbon bucket seats and carbon trim.', 'Driver environment and controls.', 'CFRP, Alcantara, leather', '', 'Alcantara: brush, do not scrub.', 0, 'interior_csl')
p('interior.seats', 'Seats', 'Two M Carbon bucket seats.', 'Hold the driver and passenger in place at 1.5 g.', 'CFRP shell, Merino leather, Alcantara', '24 kg lighter than standard sports seats', 'Shell edge trim wears from entry: use the seat-side slide.', 0)
for (const [c, nm, node] of [['left', 'Driver seat', 'seat_L_csl'], ['right', 'Passenger seat', 'seat_R_csl']] as const) {
  p(`interior.seats.${c}`, nm, `${nm} M Carbon bucket.`, 'Holds the occupant.', 'CFRP / leather', '', 'Trim wear.', 6500, node)
  p(`interior.seats.${c}.frame`, 'Seat frame', 'Carbon-fibre shell.', 'Structural shell of the seat.', 'CFRP', '3.5 kg', 'Inspect after any collision.', 3800, [`${node}_M4xNME_Carbon1001_0`])
  p(`interior.seats.${c}.cushion`, 'Cushions', 'Removable cushion pads.', 'Comfort and side support.', 'Foam, leather/Alcantara', '', 'Foam softens.', 900, [`${node}_M4xNME_Leather002_0`, `${node}_M4xNME_stitch001_0`])
  p(`interior.seats.${c}.headrest`, 'Headrest', 'Fixed integrated headrest.', 'Whiplash protection.', 'CFRP / foam', '', 'None.', 0)
  p(`interior.seats.${c}.rails`, 'Seat rails', 'Manual fore-aft rails.', 'Adjust seat position; manual to save weight.', 'Steel', '240 mm travel', 'Grit in the rail: vacuum and lubricate.', 320, [`${node}_M4xNME_silver001_0`])
  p(`interior.seats.${c}.belt`, 'Seat belt', 'Three-point belt with pretensioner.', 'Restrains the occupant.', 'Polyester webbing', 'Pyrotechnic pretensioner', 'Replace after any deployment.', 380)
}
p('interior.dash', 'Dashboard', 'Dashboard with carbon trim and the curved display.', 'Houses instruments, screen, vents and the passenger airbag.', 'PU-skinned foam, carbon inserts', '', 'Rattles from the vent frames.', 0, 'dash')
p('interior.dash.cluster', 'Instrument cluster', '12.3-inch digital cluster.', 'Shows speed, revs, M-specific shift lights.', 'TFT display', '12.3" · 1920 × 720', 'Dead pixels are a warranty item.', 1600, ['dash_M4xNME_hud2003_0'])
p('interior.dash.screen', 'Infotainment screen', '14.9-inch touch display.', 'Runs iDrive 8: navigation, media, vehicle settings.', 'Touch TFT, bonded glass', '14.9" · 2880 × 1080', 'Software reboots fix most freezes.', 1900, ['dash_M4xNME_GlassClear004_0'])
p('interior.dash.vents', 'HVAC vents', 'Four dashboard air vents.', 'Direct heated or cooled air.', 'ABS, chrome accents', '4 vents', 'Vane pivots snap.', 220, ['dash_M4xNME_Grille2003_0', 'dash_M4xNME_Grille3003_0'])
p('interior.dash.airbag', 'Passenger airbag', 'Two-stage passenger airbag.', 'Cushions the passenger in a frontal crash.', 'Nylon bag, pyrotechnic inflator', '120 l · 30 ms', 'Recall history: check VIN.', 900, ['dash_M4xNME_Leather005_0'])
p('interior.wheel', 'Steering wheel', 'M Alcantara wheel with carbon paddles.', 'Steering input plus drive-mode and cruise controls.', 'Alcantara rim, carbon-fibre paddles', '370 mm · 12 o\'clock marker', 'Alcantara greys with hand oil: brush regularly.', 1200, ['steer_stitch', 'steer_stitch001'])
p('interior.wheel.rim', 'Wheel rim', 'Alcantara-wrapped rim.', 'The part you hold.', 'Alcantara over foam and magnesium', '370 mm', 'Brush the Alcantara.', 600, ['steer_stitch_M4xNME_Leather_0', 'steer_stitch_M4xNME_stitch_0'])
p('interior.wheel.airbag', 'Driver airbag', 'Driver airbag module.', 'Protects the driver.', 'Nylon bag, inflator', '60 l', 'Replace after deployment.', 800, ['steer_stitch_M4xNME_Badge_0', 'steer_stitch_M4xNME_Black_0'])
p('interior.wheel.buttons', 'Wheel buttons', 'M1/M2 and multifunction switches.', 'Recall drive setups and control media/cruise.', 'ABS, backlit', 'M1 · M2 · 10 functions', 'Backlight LEDs fail.', 260, ['steer_stitch_M4xNME_Buttons_0', 'steer_stitch_M4xNME_Buttons2_0'])
p('interior.wheel.paddles', 'Shift paddles', 'Carbon-fibre paddles.', 'Manual up/down shifts.', 'CFRP', '', 'None.', 380, ['steer_stitch_M4xNME_Carbon1_0'])
p('interior.wheel.stalk', 'Indicator stalk', 'Turn signal and wiper stalk.', 'Indicators, high beam, wipers.', 'ABS', '', 'Self-cancel failure.', 140, 'turn_signal_stalk')
p('interior.pedals', 'Pedals', 'Aluminium pedal set.', 'Throttle and brake input.', 'Aluminium pads, steel arms', '', 'Rubber grips wear.', 180, ['brakepedal', 'gaspedal'])
p('interior.selector', 'Gear selector', 'M shift lever with Drivelogic switch.', 'Selects P/R/N/D and manual mode.', 'Leather, aluminium', '', 'Shift-by-wire: no cable to fail.', 420, ['shifter_console_A', 'shifter_console_A001'])
p('interior.console', 'Centre console', 'Carbon centre console with the M mode switches.', 'Holds the selector, iDrive controller and cup holders.', 'CFRP, leather', '', 'Carbon scratches from keys.', 1400, ['console_csl', 'console_csl001'])
p('interior.doorcards', 'Door cards', 'Carbon and Alcantara door panels with fabric pull straps.', 'Trim the door inner and hold the speakers.', 'CFRP, Alcantara', '', 'Pull-strap fraying.', 1100, ['doorpanel_FL', 'doorpanel_FR'])
p('interior.carpet', 'Carpet', 'Lightweight floor carpet.', 'Sound insulation and trim.', 'Needle-felt with foam backing', '', 'Wet carpet: check door drains.', 380)
p('interior.headliner', 'Headliner', 'Alcantara headliner.', 'Trims the roof.', 'Alcantara over foam', '', 'Sagging is unusual with Alcantara.', 620)
p('interior.mirror', 'Rear-view mirror', 'Frameless auto-dimming mirror.', 'Rear view; houses the rain sensor.', 'Electrochromic glass', '', 'Gel leak from the dimming layer.', 340)
p('interior.airbags', 'Side airbags', 'Curtain and seat-side airbags.', 'Head and thorax protection in side impacts.', 'Nylon, inflators', '4 units', 'Replace after deployment.', 1800)

/* ------------------------------------------------------------------ chassis */
p('chassis', 'Chassis', 'Steel/aluminium unibody with bolt-on subframes.', 'Everything bolts to it; it defines stiffness and crash performance.', 'Boron steel, aluminium, CFRP strut brace', 'Torsional stiffness ~ 30 kNm/°', 'Underbody inspection for corrosion at seam sealer joints.', 0)
p('chassis.unibody', 'Unibody', 'Welded body-in-white.', 'The load-bearing structure.', 'Multi-phase and hot-formed steel, aluminium front', '~300 kg', 'Never heat-straighten boron steel.', 0, ['body', 'tubs', 'fenderint'])
p('chassis.crossmembers', 'Crossmembers', 'Transmission crossmember and floor braces.', 'Tie the sills together and carry the gearbox.', 'Aluminium extrusion', '', 'Loose bolts after gearbox work.', 240, 'transmission_support')
p('chassis.strutbrace', 'Strut brace', 'Carbon-fibre front strut brace.', 'Stiffens the front towers for steering precision.', 'CFRP with aluminium ends', '1.5 kg', 'Check the tower bolts after track use.', 900, 'strutbrace_F')
p('chassis.crumple', 'Crumple zones', 'Front and rear crash boxes.', 'Absorb impact energy before the safety cell.', 'Aluminium extrusion', '', 'Replace, never repair.', 0, ['bumperbar_F', 'reinforcement_R'])
p('chassis.crumple.front', 'Front crash box', 'Front bumper beam and crash boxes.', 'Absorbs frontal impact.', 'Aluminium', '', 'Replace after impact.', 620, 'bumperbar_F')
p('chassis.crumple.rear', 'Rear crash box', 'Rear bumper beam.', 'Absorbs rear impact.', 'Aluminium', '', 'Replace after impact.', 480, 'reinforcement_R')
p('chassis.subframes', 'Subframes', 'Front and rear subframes.', 'Carry suspension and drivetrain.', 'Aluminium', '', 'Rigid rear mounts on the CSL.', 2600, ['subframe_F', 'subframe_R'])

export const PARTS: Part[] = list
export const BY_ID: Record<string, Part> = Object.fromEntries(list.map((x) => [x.id, x]))
export const CHILDREN: Record<string, Part[]> = {}
for (const x of list) (CHILDREN[x.parent] ??= []).push(x)
export const SUBSYSTEMS = CHILDREN.car.map((x) => x.id)
export const subsystemOf = (id: string) => id.split('.')[0]
export const pathOf = (id: string): Part[] => { const out: Part[] = []; let cur: Part | undefined = BY_ID[id]; while (cur) { out.unshift(cur); cur = BY_ID[cur.parent] } return out }
export const descendants = (id: string): Part[] => (CHILDREN[id] ?? []).flatMap((c) => [c, ...descendants(c.id)])
