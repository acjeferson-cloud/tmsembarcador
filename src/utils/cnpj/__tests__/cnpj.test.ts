import { describe, it, expect } from 'vitest';
import { CNPJ, validarCNPJ, calcularDV, normalizarCNPJ, formatarCNPJ } from '../index';

describe('CNPJ Validator (Receita Federal Official Algorithm)', () => {
    describe('Cálculo do Dígito Verificador', () => {
        it('deve calcular corretamente DV de CNPJ numérico', () => {
            expect(calcularDV("000000000001")).toBe("91");
        });

        it('deve calcular corretamente DV de CNPJ alfanumérico', () => {
            expect(calcularDV("12ABC34501DE")).toBe("35");
            expect(calcularDV("12.ABC.345/01DE")).toBe("35"); // aceita entrada com máscara com 12 reais caracteres
        });

        it('deve lançar erro em casos inválidos de cálculo', () => {
            expect(() => calcularDV("")).toThrow(); // Vazio
            expect(() => calcularDV("'!@#$%&*-_=+^~")).toThrow(); // não permitidos
            expect(() => calcularDV("$0123456789A")).toThrow(); // inválidos no inicio
            expect(() => calcularDV("012345?6789A")).toThrow(); // inválidos no meio
            expect(() => calcularDV("0123456789A#")).toThrow(); // no final
            expect(() => calcularDV("00000000000")).toThrow(); // digitos a menos
            expect(() => calcularDV("00000000000191")).toThrow(); // digitos a mais
        });
    });

    describe('Validação de CNPJs (CNPJ.isValid e validarCNPJ)', () => {
        it('deve retornar true para CNPJs válidos (Alfanumérico e Numérico)', () => {
            const valid = [
                "12.ABC.345/01DE-35",
                "90.021.382/0001-22",
                "90.024.778/0001-23",
                "90.025.108/0001-21",
                "90.025.255/0001-00",
                "90.024.420/0001-09",
                "90.024.781/0001-47",
                "04.740.714/0001-97",
                "44.108.058/0001-29",
                "90.024.780/0001-00",
                "90.024.779/0001-78",
                "00000000000191",
                "ABCDEFGHIJKL80" // sem máscara
            ];

            for (const cnpj of valid) {
                expect(validarCNPJ(cnpj)).toBe(true);
            }
        });

        it('deve retornar false para CNPJs inválidos', () => {
            const invalid = [
                "", // Vazio
                "'!@#$%&*-_=+^~", // não permitidos
                "$0123456789ABC", // inválidos inicio
                "0123456?789ABC", // inválidos meio
                "0123456789ABC#", // inválidos fim
                "0000000000019", // digitos a menos
                "000000000001911", // digitos a mais
                "0000000000019L", // Letra no segundo DV (deve ser numero)
                "000000000001P1", // Letra no primeiro DV
                "00000000000192", // DV invalido
                "ABCDEFGHIJKL81", // DV invalido
                "00000000000000", // Zerado
                "00.000.000/0000-00", // Zerado com máscara
                null as any,
                undefined as any
            ];

            for (const cnpj of invalid) {
                expect(validarCNPJ(cnpj)).toBe(false);
            }
        });
    });

    describe('Utilitários (normalizarCNPJ e formatarCNPJ)', () => {
        it('deve normalizar removendo pontuações e convertendo para uppercase', () => {
            expect(normalizarCNPJ("12.ABC.345/01de-35")).toBe("12ABC34501DE35");
            expect(normalizarCNPJ("90.024.779/0001-78")).toBe("90024779000178");
            expect(normalizarCNPJ("  12 34 56 ")).toBe("123456");
        });

        it('deve formatar CNPJ aplicando a máscara', () => {
            expect(formatarCNPJ("12ABC34501DE35")).toBe("12.ABC.345/01DE-35");
            expect(formatarCNPJ("12.abc.345/01de-35")).toBe("12.ABC.345/01DE-35");
            expect(formatarCNPJ("90024779000178")).toBe("90.024.779/0001-78");
            expect(formatarCNPJ("123")).toBe("123"); // se nao tem 14, retorna o proprio valor normalizado
        });
    });
});
