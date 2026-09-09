  const ROTATION = [
    { out: '10.55 PM', in: null },        // Day 1
    { out: '11.35 PM', in: '12.40 PM' },  // Day 2
    { out: '12.00 AM', in: '01.40 PM' },  // Day 3
    { out: null,       in: '02.20 PM' },  // Day 4
    { out: null,       in: null },        // Day 5 (OFF)
    { out: '05.00 AM', in: '04.10 PM' },  // Day 6
    { out: null,       in: null },        // Day 7 (OFF)
    { out: '06.00 AM', in: '05.10 PM' },  // Day 8
    { out: '07.10 AM', in: '06.00 PM' },  // Day 9
    { out: '08.10 AM', in: '06.50 PM' },  // Day 10
    { out: null,       in: null },        // Day 11 (OFF)
    { out: '09.20 AM', in: '07.50 PM' },  // Day 12
    { out: '10.20 AM', in: '09.30 PM' },  // Day 13
    { out: '11.40 AM', in: '10.30 PM' },  // Day 14
    { out: '12.20 PM', in: '11.30 PM' },  // Day 15
    { out: '01.15 PM', in: null },        // Day 16
    { out: '02.20 PM', in: '12.40 AM' },  // Day 17
    { out: null,       in: '01.40 PM' },  // Day 18
    { out: null,       in: null },        // Day 19 (OFF)
    { out: null,       in: null },        // Day 20 (OFF)
    { out: null,       in: null },        // Day 21 (OFF)
  ];

  const BUSES = [
    { number: 'ND-2903', anchorDate: new Date('2026-09-06T00:00:00Z') },
    { number: 'ND-3223', anchorDate: new Date('2026-09-09T00:00:00Z') }
  ];

  const simStartDate = new Date('2026-09-01T00:00:00Z');
  
  for (let i = 0; i < 15; i++) {
    const currentDate = new Date(simStartDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = currentDate.toISOString().split('T')[0];

    for (const bus of BUSES) {
      // Calculate diff in days from anchor
      const diffTime = currentDate.getTime() - bus.anchorDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const turnIndex = ((diffDays % 21) + 21) % 21;
      const turn = ROTATION[turnIndex];
      console.log(dateStr, bus.number, turn);
    }
  }
