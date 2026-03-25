
-- =============================================
-- EXERCÍCIOS (base para montar os treinos)
-- =============================================
INSERT INTO exercises (gym_id, name, muscle_group, category, equipment) VALUES
-- Peito
('00000000-0000-0000-0000-000000000001', 'Supino Reto com Barra', 'peito', 'compound', 'barra'),
('00000000-0000-0000-0000-000000000001', 'Supino Inclinado com Halteres', 'peito', 'compound', 'halteres'),
('00000000-0000-0000-0000-000000000001', 'Crucifixo na Máquina', 'peito', 'isolamento', 'máquina'),
('00000000-0000-0000-0000-000000000001', 'Crossover', 'peito', 'isolamento', 'cabo'),
-- Costas
('00000000-0000-0000-0000-000000000001', 'Puxada Frontal', 'costas', 'compound', 'cabo'),
('00000000-0000-0000-0000-000000000001', 'Remada Curvada', 'costas', 'compound', 'barra'),
('00000000-0000-0000-0000-000000000001', 'Remada Unilateral', 'costas', 'compound', 'halteres'),
('00000000-0000-0000-0000-000000000001', 'Pulldown', 'costas', 'compound', 'cabo'),
-- Pernas
('00000000-0000-0000-0000-000000000001', 'Agachamento Livre', 'pernas', 'compound', 'barra'),
('00000000-0000-0000-0000-000000000001', 'Leg Press 45°', 'pernas', 'compound', 'máquina'),
('00000000-0000-0000-0000-000000000001', 'Cadeira Extensora', 'pernas', 'isolamento', 'máquina'),
('00000000-0000-0000-0000-000000000001', 'Mesa Flexora', 'pernas', 'isolamento', 'máquina'),
('00000000-0000-0000-0000-000000000001', 'Stiff', 'pernas', 'compound', 'barra'),
('00000000-0000-0000-0000-000000000001', 'Panturrilha no Smith', 'pernas', 'isolamento', 'smith'),
-- Ombros
('00000000-0000-0000-0000-000000000001', 'Desenvolvimento com Halteres', 'ombros', 'compound', 'halteres'),
('00000000-0000-0000-0000-000000000001', 'Elevação Lateral', 'ombros', 'isolamento', 'halteres'),
('00000000-0000-0000-0000-000000000001', 'Elevação Frontal', 'ombros', 'isolamento', 'halteres'),
('00000000-0000-0000-0000-000000000001', 'Face Pull', 'ombros', 'isolamento', 'cabo'),
-- Bíceps
('00000000-0000-0000-0000-000000000001', 'Rosca Direta', 'bíceps', 'isolamento', 'barra'),
('00000000-0000-0000-0000-000000000001', 'Rosca Alternada', 'bíceps', 'isolamento', 'halteres'),
('00000000-0000-0000-0000-000000000001', 'Rosca Martelo', 'bíceps', 'isolamento', 'halteres'),
('00000000-0000-0000-0000-000000000001', 'Rosca Scott', 'bíceps', 'isolamento', 'barra'),
-- Tríceps
('00000000-0000-0000-0000-000000000001', 'Tríceps Pulley', 'tríceps', 'isolamento', 'cabo'),
('00000000-0000-0000-0000-000000000001', 'Tríceps Francês', 'tríceps', 'isolamento', 'halteres'),
('00000000-0000-0000-0000-000000000001', 'Tríceps Testa', 'tríceps', 'isolamento', 'barra'),
('00000000-0000-0000-0000-000000000001', 'Mergulho no Banco', 'tríceps', 'compound', 'peso corporal'),
-- Abdômen
('00000000-0000-0000-0000-000000000001', 'Abdominal Crunch', 'abdômen', 'isolamento', 'peso corporal'),
('00000000-0000-0000-0000-000000000001', 'Prancha', 'abdômen', 'isométrico', 'peso corporal'),
('00000000-0000-0000-0000-000000000001', 'Elevação de Pernas', 'abdômen', 'isolamento', 'peso corporal'),
-- Cardio
('00000000-0000-0000-0000-000000000001', 'Esteira (HIIT)', 'cardio', 'aeróbico', 'máquina'),
('00000000-0000-0000-0000-000000000001', 'Bike Ergométrica', 'cardio', 'aeróbico', 'máquina'),
('00000000-0000-0000-0000-000000000001', 'Elíptico', 'cardio', 'aeróbico', 'máquina'),
-- Glúteos
('00000000-0000-0000-0000-000000000001', 'Hip Thrust', 'glúteos', 'compound', 'barra'),
('00000000-0000-0000-0000-000000000001', 'Abdução de Quadril', 'glúteos', 'isolamento', 'máquina'),
('00000000-0000-0000-0000-000000000001', 'Búlgaro', 'glúteos', 'compound', 'halteres');

-- =============================================
-- PLANOS
-- =============================================
INSERT INTO plans (gym_id, name, price_cents, billing_cycle, goal_type, level, duration_weeks, active, benefits) VALUES
-- Hipertrofia
('00000000-0000-0000-0000-000000000001', 'Hipertrofia Iniciante', 14900, 'monthly', 'hipertrofia', 'Iniciante', 12, true, '["Treino personalizado","Acompanhamento mensal","Acesso à área de musculação"]'),
('00000000-0000-0000-0000-000000000001', 'Hipertrofia Avançado', 19900, 'monthly', 'hipertrofia', 'Avançado', 16, true, '["Periodização avançada","Acompanhamento semanal","Dieta integrada"]'),
('00000000-0000-0000-0000-000000000001', 'Hipertrofia Semestral', 79900, 'semiannual', 'hipertrofia', 'Intermediário', 24, true, '["6 meses de treino","Avaliação bimestral","Desconto especial"]'),
-- Emagrecimento
('00000000-0000-0000-0000-000000000001', 'Emagrecimento Express', 17900, 'monthly', 'emagrecimento', 'Iniciante', 8, true, '["Treino HIIT","Cardio programado","Orientação nutricional"]'),
('00000000-0000-0000-0000-000000000001', 'Emagrecimento Total', 24900, 'monthly', 'emagrecimento', 'Intermediário', 12, true, '["Treino funcional + musculação","Acompanhamento semanal","Bioimpedância mensal"]'),
-- Performance
('00000000-0000-0000-0000-000000000001', 'Performance Atlética', 29900, 'monthly', 'performance', 'Avançado', 16, true, '["Periodização esportiva","Testes de performance","Suporte do coach"]'),
('00000000-0000-0000-0000-000000000001', 'Performance Anual', 249900, 'annual', 'performance', 'Avançado', 48, true, '["Plano anual completo","Avaliações trimestrais","Prioridade no agendamento"]'),
-- Reabilitação
('00000000-0000-0000-0000-000000000001', 'Reabilitação Funcional', 22900, 'monthly', 'reabilitacao', 'Iniciante', 12, true, '["Exercícios corretivos","Mobilidade articular","Acompanhamento fisioterápico"]'),
-- Outro / Geral
('00000000-0000-0000-0000-000000000001', 'Plano Básico', 9900, 'monthly', 'outro', 'Iniciante', 4, true, '["Acesso à academia","Treino básico","Suporte por app"]'),
('00000000-0000-0000-0000-000000000001', 'Plano Premium', 34900, 'monthly', 'outro', 'Todos', 4, true, '["Acesso ilimitado","Personal trainer","Nutricionista","Aulas em grupo"]');

-- =============================================
-- WORKOUT TEMPLATES (Programas de treino)
-- =============================================

-- 1. Hipertrofia Iniciante - ABC
INSERT INTO workout_templates (id, gym_id, name, goal_type, level, weeks, notes, created_by) VALUES
('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'ABC Hipertrofia Iniciante', 'hipertrofia', 'Iniciante', 12, 'Treino ABC para iniciantes focado em ganho de massa muscular. 3x por semana.', '5596ac61-5ce2-429e-816b-c8a7c6365824');

-- 2. Hipertrofia Avançado - ABCDE  
INSERT INTO workout_templates (id, gym_id, name, goal_type, level, weeks, notes, created_by) VALUES
('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'ABCDE Hipertrofia Avançado', 'hipertrofia', 'Avançado', 16, 'Treino ABCDE avançado com volume e intensidade elevados. 5x por semana.', '5596ac61-5ce2-429e-816b-c8a7c6365824');

-- 3. Emagrecimento Express
INSERT INTO workout_templates (id, gym_id, name, goal_type, level, weeks, notes, created_by) VALUES
('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Emagrecimento Express', 'emagrecimento', 'Iniciante', 8, 'Circuito de alta intensidade + cardio para máxima queima calórica. 4x por semana.', '5596ac61-5ce2-429e-816b-c8a7c6365824');

-- 4. Emagrecimento Total
INSERT INTO workout_templates (id, gym_id, name, goal_type, level, weeks, notes, created_by) VALUES
('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Emagrecimento Total ABCD', 'emagrecimento', 'Intermediário', 12, 'Combinação de musculação + HIIT para emagrecimento sustentável.', '5596ac61-5ce2-429e-816b-c8a7c6365824');

-- 5. Performance Atlética
INSERT INTO workout_templates (id, gym_id, name, goal_type, level, weeks, notes, created_by) VALUES
('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Performance Atlética', 'performance', 'Avançado', 16, 'Periodização focada em força e potência para atletas. 5x por semana.', '5596ac61-5ce2-429e-816b-c8a7c6365824');

-- 6. Reabilitação Funcional
INSERT INTO workout_templates (id, gym_id, name, goal_type, level, weeks, notes, created_by) VALUES
('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Reabilitação Funcional', 'reabilitacao', 'Iniciante', 12, 'Exercícios corretivos e de mobilidade para reabilitação. 3x por semana.', '5596ac61-5ce2-429e-816b-c8a7c6365824');
