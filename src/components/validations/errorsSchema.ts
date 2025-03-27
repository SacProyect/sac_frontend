import { z } from 'zod'

const validTypes = ["HOME", "TAXPAYER_DETAILS", "TAXPAYERS", "WARNING", "FINES", "PAYMENT", "PAYMENT_COMPROMISE", "STATS", "OTHER"] as const


export const errorImageSchema = z.object({
    img_src: z.string().url({ message: "img_src must be a valid URL" }),
    img_alt: z.string().min(3, { message: "img_alt must have at least 3 characters" }),
});


export const errorsSchema = z.object({
    description: z.string().min(10, {
        message: "La descripción debe contener al menos 10 caracteres"
    }),

    title: z.string()
        .optional()
        .refine(value => !value || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/.test(value), {
            message: "El título solo puede contener letras, números y espacios",
        })
        .refine(value => !value || /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(value), {
            message: "El título no puede estar compuesto solo por números",
        }),


    type: z.enum(validTypes, {
        message: "Debe seleccionar un tipo válido",
    }),

    errorImages: z.array(errorImageSchema).optional(),

    userId: z.string().min(1, { message: "Por favor, cierre sesión y vuelva a iniciar sesión de nuevo" }),

})