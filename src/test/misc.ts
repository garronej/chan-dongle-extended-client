import * as misc from "../lib/misc";

//declare type MethodDecorator = <T>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> | void;

const duration: MethodDecorator= function (target, propertyKey, descriptor) {

    let out= Object.assign({}, descriptor);

    out.value= ((...args: any[])=> {

            let before= Date.now();

            let out= (descriptor.value as any).apply(target, args);

            console.log(`Duration: ${Date.now() - before}`);

            console.log(out);

            return out;

    }) as any;

    return out;


};


class Ok {


    @duration
    public static getSimCountry(imsi: string){
        return misc.getSimCountryAndSp(imsi);
    }

}

Ok.getSimCountry("208150113995832");
Ok.getSimCountry("208150113995822");
Ok.getSimCountry("208150113995832");



