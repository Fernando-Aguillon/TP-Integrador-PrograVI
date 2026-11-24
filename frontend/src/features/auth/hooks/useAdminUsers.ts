import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/shared/api/apiRequest'
import { useNotificationStore } from '@/store/notificationStore'
import type { AdminUsuario } from '../types/auth.types'
const queryKey = ['admin-users']
export function useAdminUsers() {
 const client=useQueryClient(); const notify=useNotificationStore((state)=>state.showNotification)
 const query=useQuery({queryKey,queryFn:()=>apiRequest<AdminUsuario[]>('/admin/usuarios/')})
 useEffect(() => { if (query.isError) notify(query.error instanceof Error ? query.error.message : 'No se pudieron cargar los datos.', 'error') }, [query.isError, query.error, notify])
 const changeState=useMutation({mutationFn:({id,active}:{id:number;active:boolean})=>apiRequest<AdminUsuario>(`/admin/usuarios/${id}/${active?'activar':'desactivar'}`,{method:'POST'}),onSuccess:async(_,vars)=>{await client.invalidateQueries({queryKey});notify(vars.active?'Usuario activado.':'Usuario desactivado.','success')},onError:(error)=>notify(error instanceof Error?error.message:'No se pudo actualizar el usuario.','error')})
 return {query,changeState}
}
