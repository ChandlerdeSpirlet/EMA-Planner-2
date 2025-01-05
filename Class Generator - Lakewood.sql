-- CONVERSION
    -- Dragons: -1
        -- Dragons (Floor 2): -1.5
    -- Basic: 0
        -- Basic (Floor 2): 0.5
    -- Level 1: 1
            -- Level 1 (Orange/High Orange): 1.51
            -- Level 1 (Green/High Green): 1.52
        -- Level 1 (Floor 2): 1.5
            -- Level 1 (Floor 2)(Orange/High Orange): 1.53
            -- Level 1 (Floor 2)(Green/High Green): 1.54
    -- Level 2: 2
        -- Level 2 (Floor 2): 2.5
    -- Level 3: 3
        -- Level 3 (Floor 2): 3.5
    -- Prep/Conditional: 4
        -- Prep/Conditional (Floor 2): 4.5
    -- Black Belt: 5
        -- Black Belt (Floor 2): 5.5
    -- Open Mat: 6
        -- Open Mat (Floor 2): 6.5
    -- Weapons: 7
        -- Weapons (Floor 2): 7.5
    -- Women's Sparring Clinic: 8
        -- Women's Sparring Clinic (Floor 2): 8.5
    -- Beginners BJJ: 9

-- TIMES MUST BE IN 24 HOUR FORMAT

-- MONDAY
insert into classes (starts_at, ends_at, level, class_type) values (
    generate_series('2025-01-06 16:15'::timestamp, '2025-07-15 16:15', '1 week'), 
    generate_series('2025-01-06 16:45'::timestamp, '2025-07-15 16:45', '1 week'),
    -1,
    'reg'
);
insert into classes (starts_at, ends_at, level, class_type) values (
    generate_series('2025-01-06 18:00'::timestamp, '2025-07-15 18:00', '1 week'), 
    generate_series('2025-01-06 18:30'::timestamp, '2025-07-15 18:30', '1 week'),
    0,
    'reg'
);
insert into classes (starts_at, ends_at, level, class_type) values (
    generate_series('2025-01-06 18:45'::timestamp, '2025-07-15 18:45', '1 week'), 
    generate_series('2025-01-06 19:30'::timestamp, '2025-07-15 19:30', '1 week'),
    1,
    'reg'
);
insert into classes (starts_at, ends_at, level, class_type) values (
    generate_series('2025-01-06 17:00'::timestamp, '2025-07-15 17:00', '1 week'), 
    generate_series('2025-01-06 17:45'::timestamp, '2025-07-15 17:45', '1 week'),
    2,
    'reg'
);


-- TUESDAY
insert into classes (starts_at, ends_at, level, class_type) values (
    generate_series('2025-01-07 16:30'::timestamp, '2025-07-15 16:30', '1 week'), 
    generate_series('2025-01-07 17:00'::timestamp, '2025-07-15 17:00', '1 week'),
    -1,
    'reg'
);
insert into classes (starts_at, ends_at, level, class_type) values (
    generate_series('2025-01-07 17:15'::timestamp, '2025-07-15 17:15', '1 week'), 
    generate_series('2025-01-07 17:45'::timestamp, '2025-07-15 17:45', '1 week'),
    0,
    'reg'
);
insert into classes (starts_at, ends_at, level, class_type) values (
    generate_series('2025-01-07 18:00'::timestamp, '2025-07-15 18:00', '1 week'), 
    generate_series('2025-01-07 18:45'::timestamp, '2025-07-15 18:45', '1 week'),
    1,
    'reg'
);

-- WEDNESDAY
insert into classes (starts_at, ends_at, level, class_type) values (
    generate_series('2025-01-08 16:15'::timestamp, '2025-07-15 16:15', '1 week'), 
    generate_series('2025-01-08 17:45'::timestamp, '2025-07-15 16:45', '1 week'),
    -1,
    'reg'
);
insert into classes (starts_at, ends_at, level, class_type) values (
    generate_series('2025-01-08 17:00'::timestamp, '2025-07-15 17:00', '1 week'), 
    generate_series('2025-01-08 17:30'::timestamp, '2025-07-15 17:30', '1 week'),
    0,
    'reg'
);
insert into classes (starts_at, ends_at, level, class_type) values (
    generate_series('2025-01-08 17:45'::timestamp, '2025-07-15 17:45', '1 week'), 
    generate_series('2025-01-08 18:30'::timestamp, '2025-07-15 18:30', '1 week'),
    1,
    'reg'
);

-- THURSDAY
insert into classes (starts_at, ends_at, level, class_type) values (
    generate_series('2025-01-09 16:30'::timestamp, '2025-07-15 16:30', '1 week'), 
    generate_series('2025-01-09 17:00'::timestamp, '2025-07-15 17:00', '1 week'),
    -1,
    'reg'
);
insert into classes (starts_at, ends_at, level, class_type) values (
    generate_series('2025-01-09 17:15'::timestamp, '2025-07-15 17:15', '1 week'), 
    generate_series('2025-01-09 17:45'::timestamp, '2025-07-15 17:45', '1 week'),
    0,
    'reg'
);
insert into classes (starts_at, ends_at, level, class_type) values (
    generate_series('2025-01-09 18:00'::timestamp, '2025-07-15 18:00', '1 week'), 
    generate_series('2025-01-09 18:45'::timestamp, '2025-07-15 18:45', '1 week'),
    1,
    'reg'
);

-- FRIDAY
insert into classes (starts_at, ends_at, level, class_type) values (
    generate_series('2025-01-10 16:30'::timestamp, '2025-07-15 16:30', '1 week'), 
    generate_series('2025-01-10 17:00'::timestamp, '2025-07-15 17:00', '1 week'),
    0,
    'reg'
);
insert into classes (starts_at, ends_at, level, class_type) values (
    generate_series('2025-01-10 17:15'::timestamp, '2025-07-15 17:15', '1 week'), 
    generate_series('2025-01-10 18:00'::timestamp, '2025-07-15 18:00', '1 week'),
    1,
    'reg'
);
insert into classes (starts_at, ends_at, level, class_type) values (
    generate_series('2025-01-10 18:15'::timestamp, '2025-07-15 18:15', '1 week'), 
    generate_series('2025-01-10 19:00'::timestamp, '2025-07-15 19:00', '1 week'),
    2,
    'spar'
);