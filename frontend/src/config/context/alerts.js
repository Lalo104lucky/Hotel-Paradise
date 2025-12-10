import Swal from 'sweetalert2';
import '../../index.css'


export const customAlert = (title,text,icon) =>{
    return Swal.fire({
        title,
        text,
        icon,   
        confirmButtonColor:"#3085d6",
        confirmButtonText:'Aceptar',
    });
    
};


export const alertaExito = (titulo, mensaje) => {
    Swal.fire({
        icon: 'success',
        title: titulo,
        text: mensaje,
        iconColor: '#3BA936',
        showConfirmButton: false,
        timer: 1500,
        customClass: {
            popup: 'custom-alert-success',
        }
    });
};


export const alertaError = (titulo ,mensaje) => {
    Swal.fire({
        icon: 'warning',
        title: titulo,
        text: mensaje,
        iconColor: '#AB0D2E',
        showConfirmButton: false,
        timer: 2000,
        customClass: {
            popup: 'custom-alert-error',
        }
    });
};


export const alertaCargando = (titulo, mensaje) => {
    Swal.fire({
        html: `
            <div class="flex flex-col items-center">
                <div class="loader spinner-border mt-5 mb-5"></div>
                <h2 class="swal2-title custom-alert-title mb-4">${titulo}</h2>
                <p class=" mt-4">${mensaje}</p>
            </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        customClass: {
            popup: 'custom-alert-loading',
        }
    });
};


export const alertaPregunta = (titulo, mensaje) => {
    return Swal.fire({
        icon: 'question',
        title: titulo,
        text: mensaje,
        iconColor: '#1E3A8A',
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        buttonsStyling: false,
        reverseButtons: true, 
        customClass: {
            popup: 'custom-alert-pregunta',
            confirmButton: 'custom-blue-bottom hover:bg-blue-900 text-white px-4 py-2 rounded ml-2 cursor-pointer', 
            cancelButton: 'bg-gray-100 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2 cursor-pointer', 
        }
    }).then((result) => {
        return result.isConfirmed;
    });
};