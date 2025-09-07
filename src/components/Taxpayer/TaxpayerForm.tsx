// import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { SubmitHandler, useForm, Controller } from 'react-hook-form';
import FormContainer from '../UI/FormContainer';
import { Form, Label, Button, DragAndDropContext } from 'react-aria-components';
import TextInput from '../UI/TextInput';
import SelectInput from '../UI/SelectInput';
import { json, useLoaderData, useNavigate } from 'react-router-dom';
import type { Item } from '../UI/SelectInput';
import { createTaxpayer, getParishList, getTaxpayerCategories } from '../utils/api/taxpayerFunctions';
import { useEffect, useMemo, useRef, useState } from 'react';
import { taxpayer_process, contract_type } from '../../types/taxpayer';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone'
import { HiOutlineUpload } from 'react-icons/hi';
import { Parish } from '@/types/parish';
import { TaxpayerCategories } from '@/types/taxpayerCategories';
import { normalize } from '../utils/Form utils/Normalize';



export type NewTaxpayer = {
    providenceNum: number;
    process: taxpayer_process;
    name: string;
    rif: string;
    contract_type: contract_type;
    officerId: string;
    address: string;
    emition_date: string;
    parish: string;
    category: string;
};




function TaxpayerForm() {
    const { user, refreshUser } = useAuth()
    const navigate = useNavigate();

    if (!user) {
        navigate("/login")
        return null;
    }

    const official = useLoaderData() as Item[]
    const [rifPrefix, setRifPrefix] = useState("J")
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [parishList, setParishList] = useState<Parish[]>([]);
    const [taxpayerCategories, setTaxpayerCategories] = useState<TaxpayerCategories[]>([]);
    const [showParishDropdown, setShowParishDropdown] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [selectedParishName, setSelectedParishName] = useState('');
    const [selectedCategoryName, setSelectedCategoryName] = useState('');
    const parishDropdownRef = useRef<HTMLDivElement>(null);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);
    const [parishSearch, setParishSearch] = useState('');
    const [debouncedParishSearch, setDebouncedParishSearch] = useState('');
    const [categorySearch, setCategorySearch] = useState('');
    const [debouncedCategorySearch, setDebouncedCategorySearch] = useState('');


    const {
        register,
        handleSubmit,
        reset,
        formState: { isValid, errors },
        control } = useForm({
            mode: "onSubmit",
            defaultValues: {
                providenceNum: -1,
                name: '',
                process: taxpayer_process.NA,
                rif: '',
                contract_type: contract_type.ORDINARY,
                officerId: '',
                address: '',
                emition_date: '',
                parish: '',
                category: '',
            }
        });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                parishDropdownRef.current &&
                !parishDropdownRef.current.contains(event.target as Node)
            ) {
                setShowParishDropdown(false);
            }
            if (
                categoryDropdownRef.current &&
                !categoryDropdownRef.current.contains(event.target as Node)
            ) {
                setShowCategoryDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    // Types for the arrays
    const procedureArray = [
        { value: 'VDF', name: 'VDF', id: 'VDF' },
        { value: 'FP', name: 'FP', id: 'FP' },
        { value: 'AF', name: 'AF', id: 'AF' }
    ]
    const contractArray = [
        { value: 'ORDINARY', name: 'ORDINARY', id: 'ORDINARY' },
        { value: 'SPECIAL', name: 'SPECIAL', id: 'SPECIAL' },
    ]


    // Submit form
    const onSubmit: SubmitHandler<NewTaxpayer> = async (data) => {
        try {

            if (user.role === "FISCAL" || user.role === "SUPERVISOR") data.officerId = user.id;

            // ✅ Validación frontend: verificar que se haya subido al menos un PDF
            if (!uploadedFiles || uploadedFiles.length === 0) {
                toast.error("Debe subir al menos un archivo PDF.");
                return;
            }


            // Adds rif prefix to the rif numeric data

            const formData = new FormData();

            formData.append("providenceNum", data.providenceNum.toString());
            formData.append("process", data.process);
            formData.append("name", data.name);
            formData.append("rif", rifPrefix + data.rif);
            formData.append("contract_type", data.contract_type);
            formData.append("officerId", data.officerId);
            formData.append("address", data.address);
            formData.append("emition_date", data.emition_date);
            formData.append("parish", data.parish);
            formData.append("category", data.category);

            uploadedFiles.forEach((file) => {
                formData.append("pdfs", file)
            })

            for (const pair of formData.entries()) {
                console.log(pair[0], pair[1]);
            }

            const newTaxpayer = await createTaxpayer(formData);

            if (!newTaxpayer.success) {
                // console.log("New taxpayer: " + JSON.stringify(newTaxpayer));

                toast.error(newTaxpayer.message || "Error al crear el contribuyente.");
                return;

            }

            // ✅ Éxito
            toast.success("¡Contribuyente creado exitosamente!");
            setUploadedFiles([]);
            // console.log("User before" + JSON.stringify(user))
            refreshUser();
            // console.log("User after" + JSON.stringify(user))
            reset();

            setSelectedCategoryName('');
            setSelectedParishName('');


        } catch (error) {
            console.error("Error inesperado en onSubmit:", error);
            toast.error("No se pudo crear el contribuyente, por favor, inténtelo de nuevo.");
        }
    }


    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            "application/pdf": [], // Accepts PDF's
            "application/msword": [], // Accepts .doc (Word 97-2003)
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [] // Accepts .docx (modern Word format)
        },
        multiple: true, // Allows multiple file uploads
        onDrop: (acceptedFiles) => {
            setUploadedFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
        },
    });

    const sortedOfficials = [...official].sort((a, b) => a.name.localeCompare(b.name));

    useEffect(() => {
        const fetchCategoriesAndParish = async () => {
            try {
                const parish = await getParishList();
                setParishList(parish.data);
            } catch (err) {
                console.error("Error al obtener parroquias:", err);
                toast.error("No se pudo obtener la lista de parroquias");
            }

            try {
                const categories = await getTaxpayerCategories();
                setTaxpayerCategories(categories.data);
            } catch (err) {
                console.error("Error al obtener Actividad comercial:", err);
                toast.error("No se pudo obtener la lista de actividad comercial");
            }
        };

        if (user) {
            fetchCategoriesAndParish();
        }
    }, [user]);


    // --- Debounce states (500ms) ---
    // English: Debounce parish search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedParishSearch(parishSearch), 500);
        return () => clearTimeout(t);
    }, [parishSearch]);

    // English: Debounce category search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedCategorySearch(categorySearch), 500);
        return () => clearTimeout(t);
    }, [categorySearch]);


    // --- Filtered lists with useMemo (better perf) ---
    // English: Recompute only when list or debounced query changes
    const filteredParishList = useMemo(() => {
        const q = normalize(debouncedParishSearch);
        if (!q) return parishList; // optional: show all when empty
        return parishList.filter(p => normalize(p.name).includes(q));
    }, [parishList, debouncedParishSearch]);

    const filteredCategories = useMemo(() => {
        const q = normalize(debouncedCategorySearch);
        if (!q) return taxpayerCategories;
        return taxpayerCategories.filter(c => normalize(c.name).includes(q));
    }, [taxpayerCategories, debouncedCategorySearch]);

    return (
        <>
            <div className="flex items-center justify-center w-full h-full p-4 text-xs">
                <div className="w-full max-w-[90%] sm:max-w-[30rem] bg-white p-6 rounded-lg shadow-md overflow-y-auto max-h-full lg:h-[95vh]">
                    <h2 className="w-full text-2xl font-bold text-center text-black mb-11">Agregar Contribuyente</h2>
                    <Form onSubmit={handleSubmit(onSubmit)} className=''>
                        <div className=''>
                            <Label className=''>Nro. Providencia / Nro. Oficio</Label>
                        </div>
                        <TextInput
                            placeholder={"Ingrese el numero de providencia"}
                            type='number'
                            register={{ ...register("providenceNum", { required: "Campo Obligatorio", min: { value: 0, message: "Por favor introduzca un número de providencia válido" } }) }}
                        />
                        {errors.providenceNum && <span className="text-sm text-red-600">{errors.providenceNum.message}</span>}


                        {/* Process input field */}
                        <div className='pt-2'>
                            <Controller
                                control={control}
                                name="process"
                                rules={{
                                    required: "Campo obligatorio", validate: value =>
                                        Object.values(taxpayer_process).includes(value) || "Por favor, seleccione un campo válido",
                                }}
                                render={({ field }) => (
                                    <SelectInput
                                        {...field}
                                        control={control}
                                        items={procedureArray}
                                        label="Procedimiento"
                                    />
                                )}
                            />
                        </div>
                        {errors.process && <span className="text-sm text-red-600 ">{errors.process.message}<br></br></span>}

                        {/* Taxpayer name */}
                        <div className='pt-2'>
                            <Label>Razón Social</Label>
                            <TextInput
                                placeholder={"Juan Pedro..."}
                                type='text'
                                register={{ ...register("name", { required: "Campo Obligatorio" }) }}
                            />
                        </div>
                        {errors.name && <span className="text-sm text-red-600">{errors.name.message}<br></br></span>}

                        {/* Address */}
                        <div className='pt-2'>
                            <Label>Dirección</Label>
                            <TextInput
                                placeholder={"Caracas..."}
                                type='text'
                                register={{ ...register("address", { required: "Campo Obligatorio", min: 4 }) }}
                            />
                        </div>
                        {errors.address && <span className="text-sm text-red-600">{errors.address.message}<br></br></span>}

                        <div className="relative pt-2" ref={parishDropdownRef}>
                            <Label>Parroquia</Label>
                            <Controller
                                name="parish"
                                control={control}
                                rules={{ required: "Campo obligatorio" }}
                                render={({ field: { value, onChange } }) => {
                                    // Sync input text when RHF value changes
                                    useEffect(() => {
                                        const selected = parishList.find(p => p.id === value);
                                        // If there's a selected item, show its name; otherwise keep whatever the user is typing
                                        if (selected) setParishSearch(selected.name);
                                    }, [value, parishList]);

                                    return (
                                        <div className="relative">
                                            <input
                                                onClick={() => setShowParishDropdown(prev => !prev)}
                                                className="w-full p-2 mt-1 text-left bg-white border border-gray-300 rounded"
                                                value={parishSearch}
                                                onChange={(e) => {
                                                    setParishSearch(e.target.value); // search text
                                                    if (!showParishDropdown) setShowParishDropdown(true);
                                                }}
                                                placeholder="Buscar parroquia..."
                                            />

                                            {showParishDropdown && (
                                                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded max-h-[20vh] overflow-y-auto text-sm">
                                                    {filteredParishList.map((parish) => (
                                                        <li
                                                            key={parish.id}
                                                            className="px-3 py-1 cursor-pointer hover:bg-blue-100"
                                                            onMouseDown={(e) => e.preventDefault()} // avoid input blur before click
                                                            onClick={() => {
                                                                onChange(parish.id);          // set RHF field with the ID
                                                                setParishSearch(parish.name); // show selected name in the input
                                                                setShowParishDropdown(false);
                                                            }}
                                                        >
                                                            {parish.name}
                                                        </li>
                                                    ))}
                                                    {filteredParishList.length === 0 && (
                                                        <li className="px-3 py-2 text-gray-500">Sin resultados</li>
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                    );
                                }}
                            />
                            {errors.parish && (
                                <span className="text-sm text-red-600">{errors.parish.message}</span>
                            )}
                        </div>

                        <div className="relative pt-2" ref={categoryDropdownRef}>
                            <Label>Actividad Comercial</Label>
                            <Controller
                                name="category"
                                control={control}
                                rules={{ required: "Campo obligatorio" }}
                                render={({ field: { value, onChange } }) => {
                                    // Sync text when RHF value changes
                                    useEffect(() => {
                                        const selected = taxpayerCategories.find(c => c.id === value);
                                        if (selected) setCategorySearch(selected.name);
                                    }, [value, taxpayerCategories]);

                                    return (
                                        <div className="relative">
                                            <input
                                                onClick={() => setShowCategoryDropdown(prev => !prev)}
                                                value={categorySearch}
                                                className="w-full p-2 mt-1 text-left bg-white border border-gray-300 rounded"
                                                onChange={(e) => {
                                                    setCategorySearch(e.target.value);
                                                    if (!showCategoryDropdown) setShowCategoryDropdown(true);
                                                }}
                                                placeholder="Buscar actividad comercial..."
                                            />

                                            {showCategoryDropdown && (
                                                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded max-h-[20vh] overflow-y-auto text-sm">
                                                    {filteredCategories.map((category) => (
                                                        <li
                                                            key={category.id}
                                                            className="px-3 py-1 cursor-pointer hover:bg-blue-100"
                                                            onMouseDown={(e) => e.preventDefault()} // keep input focused
                                                            onClick={() => {
                                                                onChange(category.id);          // set RHF field with the ID
                                                                setCategorySearch(category.name); // display selected name
                                                                setShowCategoryDropdown(false);
                                                            }}
                                                        >
                                                            {category.name}
                                                        </li>
                                                    ))}
                                                    {filteredCategories.length === 0 && (
                                                        <li className="px-3 py-2 text-gray-500">Sin resultados</li>
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                    );
                                }}
                            />
                            {errors.category && (
                                <span className="text-sm text-red-600">{errors.category.message}</span>
                            )}
                        </div>

                        {/* Fecha de Emisión */}
                        <div className='pt-2 pr-4'>
                            <Label>Fecha de Emisión</Label>
                            <TextInput
                                placeholder="Seleccione una fecha"
                                type="date"
                                register={{ ...register("emition_date", { required: "Campo Obligatorio" }) }}
                            />
                        </div>
                        {errors.emition_date && (
                            <span className="text-sm text-red-600">{errors.emition_date.message}</span>
                        )}

                        <div className='pt-2'>
                            <Label>RIF</Label>
                            <div className="flex items-center justify-center">
                                <select name='person-type' onChange={(e) => setRifPrefix(e.target.value)}>
                                    <option value="J" className='text-black'>J-</option>
                                    <option value="V" className='text-black'>V-</option>
                                    <option value="E" className='text-black'>E-</option>
                                    <option value="G" className='text-black'>G-</option>
                                    <option value="P" className='text-black'>P-</option>
                                </select>
                                <TextInput
                                    placeholder={"Ingrese el número de RIF"}
                                    type="text"
                                    register={{
                                        ...register("rif", {
                                            required: "Campo Obligatorio",
                                            pattern: {
                                                value: /^\d{9}$/, // Only 10 digits including the person letter
                                                message: "El RIF debe tener exactamente 9 dígitos numéricos"
                                            },
                                            minLength: {
                                                value: 9,
                                                message: "El RIF debe tener exactamente 9 dígitos numéricos"
                                            },
                                            maxLength: {
                                                value: 9,
                                                message: "El RIF debe tener exactamente 9 dígitos numéricos"
                                            },
                                        })
                                    }}
                                />
                            </div>
                            {errors.rif && <span className="text-sm text-red-600">{errors.rif.message}</span>}
                        </div>

                        <div className='pt-2'>
                            <Controller
                                control={control}
                                name="contract_type"
                                rules={{
                                    required: "Campo obligatorio",
                                    validate: (value) =>
                                        value === contract_type.ORDINARY || value === contract_type.SPECIAL
                                            ? true
                                            : "Por favor seleccione un tipo de contrato"
                                }}
                                render={({ field }) => (
                                    <SelectInput
                                        {...field}
                                        control={control}
                                        items={[
                                            { id: 'SPECIAL', name: 'ESPECIAL', value: 'SPECIAL' },
                                            { id: 'ORDINARY', name: 'ORDINARIO', value: 'ORDINARY' },
                                        ]}
                                        label="Tipo Contribuyente"
                                    />
                                )}
                            />
                        </div>
                        {errors.contract_type && <span className="text-sm text-red-600">{errors.contract_type.message}</span>}

                        {user.role === "ADMIN" ? (
                            <SelectInput
                                control={control}
                                name={"officerId"}
                                items={sortedOfficials}
                                label={"Funcionario"}
                            />
                        ) : user.role === "COORDINATOR" ? (
                            <SelectInput
                                control={control}
                                name={"officerId"}
                                items={sortedOfficials}
                                label={"Funcionario"}
                            />
                        ) : user.role === "SUPERVISOR" ? (
                            <SelectInput
                                control={control}
                                name={"officerId"}
                                items={sortedOfficials}
                                label={"Funcionario"}
                            />
                        ) : (
                            <div className="py-2">
                                <div className="py-2 mt-4 px-4 border border-[#ccc] rounded-lg bg-slate-50 w-full hover:bg-white hover:border-black hover:border-1">
                                    <Label className="block text-base font-medium">{`Funcionario: ${user.name}`}</Label>
                                </div>
                            </div>
                        )}
                        {errors.officerId && <span className="text-sm text-red-600">{errors.officerId.message}</span>}

                        {/* Drag and Drop Zone */}
                        <div className="pt-4 ">
                            <div
                                {...getRootProps()}
                                className={`flex flex-col items-center justify-center w-full h-[4rem] lg:h-[2rem] border-2 border-dashed rounded-md cursor-pointer ${"border-blue-500  bg-blue-100"
                                    } transition-all duration-200`}
                            >
                                <input {...getInputProps()} />
                                {isDragActive ? (
                                    <div className='flex items-center justify-center'>
                                        <div className='px-4 text-blue-500'>
                                            <HiOutlineUpload size={20} />
                                        </div>
                                        <p className="text-xs text-blue-500">Suelta los archivos aquí...</p>
                                    </div>

                                ) : (
                                    <div className='flex items-center justify-center'>
                                        <div className='px-4 text-blue-500'>
                                            <HiOutlineUpload size={20} />
                                        </div>
                                        <p className="text-xs text-gray-600">Arrastra y suelta los archivos o haz clic aquí para seleccionarlos</p>
                                    </div>
                                )}
                            </div>

                            {/* Display Uploaded Files */}
                            {uploadedFiles.length > 0 && (
                                <div className="h-10 mt-4 space-y-1 ">
                                    <p className="font-semibold">Archivos subidos:</p>
                                    <ul className="h-10 space-y-1 overflow-y-auto text-sm text-gray-700">
                                        {uploadedFiles.map((file, index) => (
                                            <li key={index} className="flex items-center space-x-2">
                                                <span>📄 {file.name}</span>
                                                <span className="text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>


                        <Button
                            type='submit'
                            className={
                                `w-full 
                        p-2 
                        mt-4
                        bg-[#007bff] 
                        hover:bg-[#0056b3] 
                        text-white font-bold 
                        rounded-lg 
                        cursor-pointer 
                        disabled:bg-gray-400`
                            }
                        >
                            Enviar
                        </Button>
                    </Form>

                </div>
            </div>
        </>
    )
}

export default TaxpayerForm